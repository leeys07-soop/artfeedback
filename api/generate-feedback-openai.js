export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API Key가 설정되지 않았습니다.' });
  }

  try {
    const { name, s1, s2, s3, s4 } = req.body;

    const prompt = `강사가 수업 중 관찰한 내용입니다. 이를 바탕으로 학부모님께 보내는 수업 피드백을 작성해주세요.

아이 이름: ${name || '아이'}
아이의 마음: ${s1 || '기록 없음'}
수업 과정: ${s2 || '기록 없음'}
성장한 부분: ${s3 || '기록 없음'}
강사가 건넨 말: ${s4 || '기록 없음'}

---

아래 예시와 같은 문체와 느낌으로 작성해주세요.

[예시 1]
오일파스텔로 아기오리의 부드러운 털을 표현하는 것이 쉽지 않았을 텐데도, 민영이는 차분히 집중하며 끝까지 참여하는 아름다운 모습을 보여주었습니다. 짧은 선들을 겹겹이 쌓아 올리며 다양한 색을 활용해 아기오리의 풍성한 털을 하나하나 정성껏 표현하는 과정이 인상 깊었습니다. 특히, 새로운 재료인 마카를 마주했을 때는 호기심 가득한 눈빛으로 연못생물들을 칠하며 다채로운 색감을 과감하게 시도하는 등, 스스로 탐색하고 표현의 폭을 넓혀가는 성장이 매우 돋보였습니다. 처음의 조심스러운 손길이 점차 자신감 있는 표현으로 이어지는 모습에서 민영이의 작은 용기와 예술적 잠재력을 느낄 수 있었습니다.

[예시 2]
조심스럽게 시작했던 손길이 아기 오리의 보송한 털을 표현하며 점차 자신감을 찾아갔습니다. 오일파스텔로 털을 표현하는 것이 처음엔 어렵게 느껴졌지만, 민영이는 짧은 선과 다양한 색을 사용해 아기 오리의 보드라운 털을 하나하나 정성껏 담아냈습니다. 특히 연못 생물을 칠할 때는 새로운 재료인 마카에 대한 호기심을 활짝 드러내며, 망설임 없이 다채로운 색깔을 시도하는 모습에서 민영이의 예술적 탐색이 한 층 더 깊어지고 있음을 느낄 수 있었습니다. 수업 내내 차분하게 집중하며 자신만의 세계를 완성해가는 민영이의 모습이 참 예뻤습니다.

---

위 예시처럼 모든 문장을 "~했습니다", "~입니다", "~됩니다" 로 끝내주세요.
"~봐요", "~고요", "~더라고요", "~네요" 같은 친근한 말투는 절대 사용하지 마세요.
학부모님께 드리는 정중하고 따뜻한 글이지만, 딱딱하지 않고 자연스럽게 써주세요.
강사 메모의 내용을 반드시 글 안에 녹여내고, 마지막 문장은 마침표로 완성해주세요.
인사말이나 서명 없이 피드백 본문만 작성해주세요.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content: `당신은 10년 경력의 미술학원 원장으로, 학부모님께 수업 피드백을 전달합니다.
모든 문장은 반드시 "~했습니다", "~입니다", "~됩니다" 체로 끝냅니다.
"~봐요", "~고요", "~더라고요", "~네요" 같은 친근한 말투는 절대 사용하지 않습니다.
인사말로 시작하지 않습니다.
"○○ 학생"이라는 표현은 쓰지 않고 "민영이가", "지율이는" 처럼 이름만 씁니다.
"오늘 수업에서", "이번 시간에" 같은 뻔한 첫 문장은 쓰지 않습니다.
강사 메모에 있는 내용을 반드시 글 안에 자연스럽게 녹여냅니다.
문장을 중간에 끊지 않고 반드시 완성합니다.`
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      if (response.status === 401) {
        return res.status(401).json({ error: 'OpenAI API Key가 올바르지 않습니다.' });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
      }
      return res.status(response.status).json({ error: err.error?.message || '오류가 발생했습니다.' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });

  } catch (e) {
    return res.status(500).json({ error: e.message || '서버 오류가 발생했습니다.' });
  }
}
