// 排行榜单条记录
export type ScoreRecord = {
  name: string;
  score: number;
  time: number; // 时间戳，用于排序或展示
};

// 提交分数的请求体
export type SubmitScoreBody = {
  name: string;
  score: number;
};

// 获取排行榜返回值
export type LeaderboardResponse = ScoreRecord[];
