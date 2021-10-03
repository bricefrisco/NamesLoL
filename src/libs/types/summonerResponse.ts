import {SummonerEntity} from "@libs/types/summonerEntity";

export interface SummonerResponse {
  summoners: SummonerEntity[],
  forwards: number,
  backwards: number
}