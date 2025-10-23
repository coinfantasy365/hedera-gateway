import { APIClient } from './client.js';
import {
  HCSEventData,
  HCSPublishResult,
  EventVerificationResult,
  LeagueEventData,
  MatchEventData,
  DraftEventData
} from './types.js';

export class HCSManager {
  constructor(private client: APIClient) {}

  /**
   * Publish a generic event to HCS
   */
  async publishEvent(eventData: HCSEventData): Promise<HCSPublishResult> {
  const response = await this.client.post<{ operationId: string; transactionId?: string; consensusTimestamp?: string; sequenceNumber?: number }>('/hedera/gateway/hcs/publish', {
      topicId: process.env.HCS_TOPIC_ID,
      message: `${eventData.eventType}: ${JSON.stringify(eventData.data)}`,
      eventType: eventData.eventType,
      metadata: {
        ...eventData.data,
        ...eventData.metadata,
        timestamp: new Date().toISOString()
      }
    });

    return {
      operationId: response.operationId,
      transactionId: response.transactionId,
      consensusTimestamp: response.consensusTimestamp,
      sequenceNumber: response.sequenceNumber
    };
  }

  /**
   * Publish league creation event
   */
  async publishLeagueCreated(data: LeagueEventData): Promise<HCSPublishResult> {
    return this.publishEvent({
      eventType: 'LEAGUE_CREATED',
      data: {
        leagueId: data.leagueId,
        name: data.name,
        createdBy: data.createdBy,
        settings: data.settings
      }
    });
  }

  /**
   * Publish match started event
   */
  async publishMatchStarted(data: MatchEventData): Promise<HCSPublishResult> {
    return this.publishEvent({
      eventType: 'MATCH_STARTED',
      data: {
        matchId: data.matchId,
        leagueId: data.leagueId,
        team1Id: data.team1Id,
        team2Id: data.team2Id,
        startTime: data.startTime
      }
    });
  }

  /**
   * Publish match settled event
   */
  async publishMatchSettled(data: MatchEventData): Promise<HCSPublishResult> {
    if (!data.endTime || data.winner === undefined) {
      throw new Error('Match settlement requires endTime and winner');
    }

    return this.publishEvent({
      eventType: 'MATCH_SETTLED',
      data: {
        matchId: data.matchId,
        leagueId: data.leagueId,
        endTime: data.endTime,
        score1: data.score1,
        score2: data.score2,
        winner: data.winner
      }
    });
  }

  /**
   * Publish draft completed event
   */
  async publishDraftCompleted(data: DraftEventData): Promise<HCSPublishResult> {
    return this.publishEvent({
      eventType: 'DRAFT_COMPLETED',
      data: {
        draftId: data.draftId,
        leagueId: data.leagueId,
        participants: data.participants,
        totalPicks: data.picks.length,
        picks: data.picks
      }
    });
  }

  /**
   * Verify an event exists on the HCS topic
   */
  async verifyEvent(eventId: string): Promise<EventVerificationResult> {
  const response = await this.client.get<{ verified: boolean; consensusTimestamp?: string; transactionId?: string; mirrorNodeData?: Record<string, unknown> }>(`/hedera/events/${eventId}/verify`);
    
    return {
      eventId,
      verified: response.verified,
      consensusTimestamp: response.consensusTimestamp,
      transactionId: response.transactionId,
      mirrorNodeData: response.mirrorNodeData
    };
  }

  /**
   * Get all events for a specific league
   */
  async getLeagueEvents(leagueId: number): Promise<EventVerificationResult[]> {
  const response = await this.client.get<{ events?: EventVerificationResult[] }>(`/hedera/leagues/${leagueId}/events`);
  return response.events || [];
  }

  /**
   * Get event history with pagination
   */
  async getEventHistory(
    options: {
      eventType?: string;
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<EventVerificationResult[]> {
  const response = await this.client.get<{ events?: EventVerificationResult[] }>('/hedera/events', options);
  return response.events || [];
  }
}