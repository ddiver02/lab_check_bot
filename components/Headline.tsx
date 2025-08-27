import React from 'react';

const Headline: React.FC = () => {
  return (
    <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
      <h1 className="text-3xl font-bold">한 문장을 선물드려요.</h1>
      <p className="mt-2 text-sm text-gray-700">
        ‘책 속에서 오늘의 대답을 찾는다’는 철학으로, <br />
        감정에 맞는 한 구절을 제안하는 인용구 추천 서비스입니다.
      </p>
    </div>
  );
};

export default Headline;