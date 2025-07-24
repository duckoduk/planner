async function loadRankingData() {
    const res = await fetch('/rank-data');
    const result = await res.json();
    console.log('랭킹 데이터:', result);
}

loadRankingData();

