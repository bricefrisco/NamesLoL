export interface Status {
  message: string
}

export interface RiotResponse {
  status?: Status,
  accountId: string;
  profileIconId: number;
  revisionDate: number;
  name: string;
  id: string;
  puuid: string;
  summonerLevel: number;
}