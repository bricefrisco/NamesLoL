import { Region } from '@libs/types/region';

export interface SummonerEntity {
  name: string;
  region: Region;
  accountId: string;
  revisionDate: number;
  availabilityDate: number;
  level: number;
  lastUpdated: number;
  summonerIcon: number;
}
