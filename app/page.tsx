"use client";
import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type Message = { id: number; content: string; created_at: string };

export default function Home() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  async function loadMessages() {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: false })
      .limit(5);
    if (data) setMessages(data);
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSubmit() {
    if (!text) return;
    const supabase = getSupabase();
    const { error } = await supabase.from("messages").insert({ content: text });
  
    if (error) {
      console.error("❌ Insert error:", error.message);
      alert("메시지 저장 실패: " + error.message);
      return;
    }
  
    setText("");
    loadMessages();
  }

  return (
    <section className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 p-10 text-center">
        <h1 className="text-2xl font-bold">여기가 랜딩입니다</h1>
        <p className="mt-2 text-sm">Supabase에 메시지를 저장하고 불러옵니다.</p>
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="텍스트를 입력하세요"
          className="flex-1 rounded-lg border p-3 outline-none"
        />
        <button
          onClick={(e) => {
          e.preventDefault();   // ← 리로드 방지
          handleSubmit();
                }}
            className="rounded-lg border px-4 py-2"
            >
            저장
        </button>

      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">최근 메시지</h2>
        <ul className="list-disc pl-5 text-sm">
          {messages.map((m) => (
            <li key={m.id}>
              {m.content} <span className="text-gray-500">({m.created_at})</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
