export default function About() {
    return (
      <section className="space-y-8">
        <h2 className="text-xl font-semibold">About us</h2>
        <p className="text-sm text-gray-700">
          책봍은 문장이 중심이 되는 독서 문화를 만들어 갑니다!
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSci5XJsRBr4wuh211ysvqtz-zmOErh-Y3wZSuc6eLDPnVOHKw/viewform" className="rounded-lg border p-4 hover:bg-gray-50" target="_blank">
            💥 책봍 설문조사 참여하기
          </a>
          <a href="https://www.instagram.com/check._.bot/" className="rounded-lg border p-4 hover:bg-gray-50" target="_blank">
            👀 책봍 인스타 구경하기
          </a>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdslKYusOwWJ7ELjvD81MYe5dxXQSWpYQDodLICE4adxTlwQg/viewform?usp=header" className="rounded-lg border p-4 hover:bg-gray-50" target="_blank">
            ✍🏼 책봍 의견 남기기
          </a>
        </div>
      </section>
    );
  }
  