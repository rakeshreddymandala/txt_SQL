from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List, Tuple
import os
from dotenv import load_dotenv
import mysql.connector
from huggingface_hub import InferenceClient
import json
import time

load_dotenv()

# Initialize configuration
HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
if not HF_TOKEN:
    raise ValueError("HUGGINGFACE_TOKEN environment variable is not set")

HUGGINGFACE_REPO_ID = "mistralai/Mistral-7B-Instruct-v0.3"
SYSTEM_PROMPT = "You are an expert SQL engineer. You will be given a database schema and a question. Your task is to write an SQL query that answers the question. Only return the SQL query, no explanations."

# Initialize Hugging Face client with Mixtral configuration
client = InferenceClient(
    model=HUGGINGFACE_REPO_ID,
    token=HF_TOKEN
)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DBConnection(BaseModel):
    host: str
    port: str
    user: str
    password: str
    database: str

class Query(BaseModel):
    question: str
    db_schema: Dict[str, List[List[str]]]  # Keep as List[List[str]]
    connection: dict

class SQLFileConfig(BaseModel):
    host: str = "localhost"
    port: str = "3306"
    user: str = "root"
    password: str = ""
    database: str = ""

@app.get("/default-connection")
async def get_default_connection():
    return {
        "host": os.getenv("MYSQL_HOST", "localhost"),
        "port": os.getenv("MYSQL_PORT", "3306"),
        "user": os.getenv("MYSQL_USER", "root"),
        "database": os.getenv("MYSQL_DATABASE", ""),
        # Don't expose password in response
        "password": ""
    }

def get_table_schema(cursor, table_name) -> List[Tuple[str, str]]:
    """Get column names and types for a table"""
    cursor.execute(f"DESCRIBE {table_name}")
    columns = cursor.fetchall()
    return [(col[0], col[1]) for col in columns]  # name, type pairs

def format_schema_as_text(schema: Dict[str, List[Tuple[str, str]]]) -> str:
    """Convert schema dictionary to formatted string"""
    text = "The database has the following tables:\n\n"
    
    for table_name, columns in schema.items():
        text += f"1. Table '{table_name}':\n"
        for col_name, col_type in columns:
            text += f"   - {col_name} ({col_type})\n"
        text += "\n"
    
    return text

def build_llm_prompt(schema_text: str, question: str) -> str:
    """Create the full prompt for the LLM"""
    return f"""You are an expert at converting natural language to SQL queries.
Given this database schema:

{schema_text}

Convert this question into a valid SQL query that will run on the schema above:
Question: {question}

Return only the SQL query without any explanation or markdown formatting.
The query should be accurate, efficient, and use proper table/column names from the schema.
"""

def extract_detailed_schema(connection: DBConnection) -> Dict[str, List[Tuple[str, str]]]:
    """Extract full schema with column types from database"""
    schema = {}
    try:
        conn = mysql.connector.connect(
            host=connection.host,
            port=int(connection.port),
            user=connection.user,
            password=connection.password,
            database=connection.database
        )
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        # Get detailed schema for each table
        for table in tables:
            table_name = table[0]
            schema[table_name] = get_table_schema(cursor, table_name)
        
        cursor.close()
        conn.close()
        return schema
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/connect")
async def connect_db(connection: DBConnection):
    try:
        schema = extract_detailed_schema(connection)
        schema_text = format_schema_as_text(schema)
        return {
            "message": "Connection successful",
            "schema": schema,
            "schema_text": schema_text
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/upload-sql")
async def upload_sql(
    file: UploadFile,
    host: str = "localhost",
    port: str = "3306",
    user: str = "root",
    password: str = "",
    database: str = ""
):
    if not file.filename.endswith('.sql'):
        raise HTTPException(status_code=400, detail="File must be SQL")
    
    try:
        # Create a temporary connection
        conn = mysql.connector.connect(
            host=host,
            port=int(port),
            user=user,
            password=password
        )
        cursor = conn.cursor()

        # Create database if it doesn't exist
        if not database:
            database = "uploaded_sql_db"
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database}")
        cursor.execute(f"USE {database}")

        # Read and execute SQL file
        content = await file.read()
        sql_commands = content.decode('utf-8').split(';')
        
        for command in sql_commands:
            if command.strip():
                cursor.execute(command)
        
        conn.commit()

        # Get schema after executing SQL
        schema = extract_detailed_schema(DBConnection(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        ))
        schema_text = format_schema_as_text(schema)

        cursor.close()
        conn.close()

        return {
            "message": "SQL file processed successfully",
            "schema": schema,
            "schema_text": schema_text
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def generate_sql(prompt: str) -> str:
    """Generate SQL using Mistral with better error handling"""
    try:
        # Format prompt for Mistral
        full_prompt = f"""<s>[INST] As an SQL expert, write a SQL query for the following schema and question.

Schema and Question:
{prompt}

Requirements:
1. Return ONLY the SQL query
2. Do not include explanations
3. Do not use markdown formatting
4. Use proper table/column names from the schema
5. Always end the query with a semicolon
6. Use standard SQL syntax compatible with MySQL
7. Ensure all quotes and parentheses are properly closed [/INST]</s>"""

        print("Sending prompt to Mistral:", full_prompt)  # Debug log
        
        response = client.text_generation(
            full_prompt,
            max_new_tokens=256,
            temperature=0.3,  # More deterministic
            do_sample=False,
            stop=["[INST]", "</s>"],  # Stop at instruction tokens
            repetition_penalty=1.1
        )
        
        print("Raw response from Mistral:", response)  # Debug log
        
        if not response or not response.strip():
            raise HTTPException(status_code=400, detail="Empty response from model")

        # Clean up response to extract just the SQL
        sql = response.strip()
        
        # Enhanced cleaning steps
        sql = sql.replace('\n', ' ').strip()
        sql = ' '.join(sql.split())  # Normalize whitespace
        
        # Remove common prefixes/suffixes Mistral might add
        prefixes_to_remove = [
            "Here's the SQL query:",
            "SQL query:",
            "The SQL query would be:",
            "Here's a query that"
        ]
        for prefix in prefixes_to_remove:
            if sql.lower().startswith(prefix.lower()):
                sql = sql[len(prefix):].strip()
        
        # Extract SQL from code blocks if present
        if "```sql" in sql.lower():
            sql = sql.split("```sql")[1].split("```")[0].strip()
        elif "```" in sql:
            sql = sql.split("```")[1].strip()

        # Ensure query ends with semicolon
        if not sql.endswith(';'):
            sql += ';'
        
        # Basic SQL syntax validation
        required_keywords = ['SELECT', 'FROM']
        if not any(keyword in sql.upper() for keyword in required_keywords):
            raise HTTPException(status_code=400, detail="Invalid SQL query structure")
        
        print("Cleaned SQL:", sql)  # Debug log
        
        if not sql:
            raise HTTPException(status_code=400, detail="Failed to extract valid SQL query")
            
        return sql

    except Exception as e:
        print(f"SQL Generation Error: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to generate SQL query: {str(e)}"
        )

@app.post("/query")
async def process_query(query: Query):
    try:
        # Format schema for prompt
        schema_text = "Schema:\n"
        for table_name, columns in query.db_schema.items():
            schema_text += f"\nTable {table_name}:\n"
            for col in columns:
                schema_text += f"- {col[0]} ({col[1]})\n"
        
        prompt = f"""You are an expert SQL query generator.

Given this database schema:
{schema_text}

Generate a SQL query that answers this question:
{query.question}

Rules:
- Return only the SQL query, no explanations
- Use proper JOIN syntax when needed
- Match schema column names exactly
- Use UPPER case for SQL keywords

SQL Query:"""

        # Generate SQL
        generated_sql = await generate_sql(prompt)
        
        if not generated_sql:
            raise HTTPException(status_code=400, detail="Failed to generate SQL query")

        # Execute query with better error handling
        conn = mysql.connector.connect(
            host=query.connection['host'],
            port=int(query.connection['port']),
            user=query.connection['user'],
            password=query.connection['password'],
            database=query.connection['database']
        )
        
        cursor = conn.cursor(dictionary=True)
        try:
            # Remove trailing semicolon before execution to prevent empty query errors
            sql_to_execute = generated_sql.rstrip(';')
            cursor.execute(sql_to_execute)
            results = cursor.fetchall()
        except mysql.connector.Error as e:
            raise HTTPException(status_code=400, detail=f"MySQL Error: {str(e)}")
        finally:
            cursor.close()
            conn.close()

        return {
            "sql": generated_sql,
            "results": results
        }

    except Exception as e:
        print("Error details:", str(e))
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))  # default to 8000 if PORT is not set
    uvicorn.run("main:app", host="0.0.0.0", port=port)

