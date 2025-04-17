import React from 'react';

function AnimationGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-6 bg-white/10 backdrop-blur-lg rounded-lg hover:scale-105 transform transition duration-300 hover:shadow-xl">
        <div className="text-white text-center">
          <div className="animate-spin h-12 w-12 mx-auto border-4 border-t-blue-500 rounded-full mb-4"></div>
          <h3 className="font-semibold">Spinning Animation</h3>
        </div>
      </div>

      <div className="p-6 bg-white/10 backdrop-blur-lg rounded-lg hover:scale-105 transform transition duration-300 hover:shadow-xl">
        <div className="text-white text-center">
          <div className="animate-pulse h-12 w-12 mx-auto bg-blue-500 rounded-full mb-4"></div>
          <h3 className="font-semibold">Pulse Animation</h3>
        </div>
      </div>

      <div className="p-6 bg-white/10 backdrop-blur-lg rounded-lg hover:scale-105 transform transition duration-300 hover:shadow-xl">
        <div className="text-white text-center">
          <div className="animate-ping h-12 w-12 mx-auto bg-blue-500 rounded-full mb-4"></div>
          <h3 className="font-semibold">Ping Animation</h3>
        </div>
      </div>
    </div>
  );
}

export default AnimationGrid;
