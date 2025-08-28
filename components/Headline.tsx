import React from 'react';

const Headline: React.FC = () => {
  return (
    <div className=" bg-white p-5 text-center">
      <h1 className="text-[12pt] font-bold">당신의 문장</h1>
      <p className="mt-2 text-[7pt] text-gray-700">
        ‘문장 속에서 오늘의 대답을 찾는다’ <br />
      </p>
    </div>
  );
};

export default Headline;