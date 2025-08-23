export default function About() {
    return (
      <section className="space-y-8">
        <h2 className="text-xl font-semibold">About us</h2>
        <p className="text-sm text-gray-700">
          우리의 MVP는 간단하고 빠른 검증을 목표로 합니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="https://github.com" className="rounded-lg border p-4 hover:bg-gray-50" target="_blank">
            링크 #1 (예: GitHub)
          </a>
          <a href="https://supabase.com" className="rounded-lg border p-4 hover:bg-gray-50" target="_blank">
            링크 #2 (예: Supabase)
          </a>
        </div>
      </section>
    );
  }
  