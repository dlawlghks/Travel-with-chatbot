const apiKey = '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';
const fs = require('fs');
const OpenAI = require('openai');
const express = require('express');
const cors = require('cors');
const app = express();

const openai = new OpenAI({ apiKey: apiKey });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/travelTell', async function (req, res) {
    const travelDestination = req.body.destination;
    const userMessage = req.body.message;
    // 사용자 입력 검증
    if (!travelDestination || typeof travelDestination !== 'string') {
        return res.status(400).send('유효하지 않은 여행지역 입력');
    }

    // 파일 경로 조정
    const filePath = `C:/gajanggge/${travelDestination}.txt`;

    // 파일 읽기 시도
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: fileContent },
                { role: "system", content: "당신은 여행계획을 짜주는 서비스명 '가장께'입니다. 당신은 제공된 파일내용으로만 대답을 해주어야 합니다.  또한 당신은 파일에 저장되어있는 가격을 총 예산에서 빼서 사용자의 여행 경비를 계산해줄 수 있습니다. 하나의 정보를 알려준 후에는 줄바꿈 후에 다음 정보를 알려줘야합니다. 여행지를 추천해달라는 말을 들으면 여행지 이름을 알려주고, 여행지에 관한 소개를 해줘야합니다. 또한 정보를 알려줄때 이미지url과 링크url을 정확하게 알려줘야합니다. 또한 당신은 사용자가 번역해달라는 말을 요청언어에 맞게 번역을 해줄 수 있으며 한국어로 어떻게 읽는건지 알려줄 수 있습니다." },
                { role: "user", content: userMessage },
                // 사용자의 질문을 여기에 추가할 수 있습니다.
            ],
        });

        const travel = completion.choices[0].message['content'];
        console.log(travel);
        res.json({ "assistant": travel });
    } catch (error) {
        console.error('파일 읽기 오류:', error);
        res.status(500).send('파일을 읽을 수 없습니다. 파일 경로를 확인해주세요.');
    }
});

app.listen(3000);
