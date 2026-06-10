const response = http.get('http://localhost:3000/answer-list?region=' + output.env.REGION_ID);
const body = json(response.body);
output.answerList = body;
