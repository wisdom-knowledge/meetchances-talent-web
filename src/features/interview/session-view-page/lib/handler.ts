/**
 * Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. All Rights Reserved.
 * SPDX-license-identifier: BSD-3-Clause
 */

import logger from '@/utils/logger';
import { useRoomStore } from '@/stores/interview/room';
import RtcClient from '@/features/interview/session-view-page/lib/RtcClient';

/**
 * @brief 将字符串包装成 TLV
 */
export const string2tlv = (str: string, type: string) => {
  const typeBuffer = new Uint8Array(4)
  for (let i = 0; i < type.length; i++) typeBuffer[i] = type.charCodeAt(i)
  const lengthBuffer = new Uint32Array(1)
  const valueBuffer = new TextEncoder().encode(str)
  lengthBuffer[0] = valueBuffer.length
  const tlvBuffer = new Uint8Array(typeBuffer.length + 4 + valueBuffer.length)
  tlvBuffer.set(typeBuffer, 0)
  tlvBuffer[4] = (lengthBuffer[0] >> 24) & 0xff
  tlvBuffer[5] = (lengthBuffer[0] >> 16) & 0xff
  tlvBuffer[6] = (lengthBuffer[0] >> 8) & 0xff
  tlvBuffer[7] = lengthBuffer[0] & 0xff
  tlvBuffer.set(valueBuffer, 8)
  return tlvBuffer.buffer
}

/**
 * @brief TLV 数据格式转换成字符串
 * @note TLV 数据格式 | magic number | length(big-endian) | value |
 */
export const tlv2String = (tlvBuffer: ArrayBufferLike) => {
  const typeBuffer = new Uint8Array(tlvBuffer, 0, 4)
  const lengthBuffer = new Uint8Array(tlvBuffer, 4, 4)
  const valueBuffer = new Uint8Array(tlvBuffer, 8)
  let type = ''
  for (let i = 0; i < typeBuffer.length; i++) type += String.fromCharCode(typeBuffer[i])
  const length = (lengthBuffer[0] << 24) | (lengthBuffer[1] << 16) | (lengthBuffer[2] << 8) | lengthBuffer[3]
  const value = new TextDecoder().decode(valueBuffer.subarray(0, length))
  return { type, value }
}

export type AnyRecord = Record<string, unknown>;

export enum MESSAGE_TYPE {
  BRIEF = 'conv',
  SUBTITLE = 'subv',
  FUNCTION_CALL = 'tool',
}

export enum AGENT_BRIEF {
  UNKNOWN,
  LISTENING,
  THINKING,
  SPEAKING,
  INTERRUPTED,
  FINISHED,
}

/**
 * @brief 指令类型
 */
export enum COMMAND {
  /**
   * @brief 打断指令
   */
  INTERRUPT = 'interrupt',
  /**
   * @brief 发送外部文本驱动 TTS
   */
  EXTERNAL_TEXT_TO_SPEECH = 'ExternalTextToSpeech',
  /**
   * @brief 发送外部文本驱动 LLM
   */
  EXTERNAL_TEXT_TO_LLM = 'ExternalTextToLLM',
}
/**
 * @brief 打断的类型
 */
export enum INTERRUPT_PRIORITY {
  /**
   * @brief 占位
   */
  NONE,
  /**
   * @brief 高优先级。传入信息直接打断交互，进行处理。
   */
  HIGH,
  /**
   * @brief 中优先级。等待当前交互结束后，进行处理。
   */
  MEDIUM,
  /**
   * @brief 低优先级。如当前正在发生交互，直接丢弃 Message 传入的信息。
   */
  LOW,
}

export const MessageTypeCode = {
  [MESSAGE_TYPE.SUBTITLE]: 1,
  [MESSAGE_TYPE.FUNCTION_CALL]: 2,
  [MESSAGE_TYPE.BRIEF]: 3,
};

export const useMessageHandler = () => {
  // 使用独立选择器，避免返回新对象导致 useSyncExternalStore 无限循环
  const setHistoryMsg = useRoomStore((s) => s.setHistoryMsg)
  const setInterruptMsg = useRoomStore((s) => s.setInterruptMsg)
  const updateAITalkState = useRoomStore((s) => s.updateAITalkState)
  const updateAIThinkState = useRoomStore((s) => s.updateAIThinkState)

  const maps = {
    /**
     * @brief 接收状态变化信息
     * @note https://www.volcengine.com/docs/6348/1415216?s=g
     */
    [MESSAGE_TYPE.BRIEF]: (parsed: AnyRecord) => {
      const stage = (parsed as { Stage?: { Code?: number; Description?: string } }).Stage ?? {}
      const code = stage.Code
      const desc = stage.Description
      logger.debug('[MESSAGE_TYPE.BRIEF]: ', code, desc)
      switch (code) {
        case AGENT_BRIEF.THINKING:
          updateAIThinkState({ isAIThinking: true });
          break;
        case AGENT_BRIEF.SPEAKING:
          updateAITalkState({ isAITalking: true });
          break;
        case AGENT_BRIEF.FINISHED:
          updateAITalkState({ isAITalking: false });
          break;
        case AGENT_BRIEF.INTERRUPTED:
          setInterruptMsg();
          break;
        default:
          break;
      }
    },
    /**
     * @brief 字幕
     * @note https://www.volcengine.com/docs/6348/1337284?s=g
     */
    [MESSAGE_TYPE.SUBTITLE]: (parsed: AnyRecord) => {
      const dataArr = (parsed as { data?: unknown[] }).data
      const data = Array.isArray(dataArr) ? (dataArr[0] as { text?: string; definite?: boolean; userId?: string; paragraph?: boolean }) : undefined
      /** debounce 记录用户输入文字 */
      if (data) {
        const { text: msg, definite, userId: user, paragraph } = data
        const isAudioEnable = RtcClient.getAgentEnabled();
        const win = window as { _debug_mode?: boolean }
        if (win._debug_mode) logger.debug('handleRoomBinaryMessageReceived', data)
        logger.debug({ isAudioEnable, msg, definite, user, paragraph })
        if (isAudioEnable && typeof msg === 'string') {
          console.log('>>> setHistoryMsg', msg, user, paragraph, definite)
          setHistoryMsg({ text: msg, user: String(user ?? ''), paragraph: Boolean(paragraph), definite: Boolean(definite) });
        }
      }
    },
    /**
     * @brief Function calling
     * @note https://www.volcengine.com/docs/6348/1359441?s=g
     */
    [MESSAGE_TYPE.FUNCTION_CALL]: (parsed: AnyRecord) => {
      const toolCalls = (parsed as { tool_calls?: Array<{ id?: string; function?: { name?: string } }> }).tool_calls ?? []
      const first = toolCalls[0]
      const name = first?.function?.name ?? ''
      logger.debug('[Function Call] - Called by sendUserBinaryMessage')
      const map: Record<string, string> = {
        getcurrentweather: '今天下雪， 最低气温零下10度',
      };

      const toolCallId = first?.id ?? ''
      const key = name ? name.toLocaleLowerCase().split('_').join('') : ''
      const content = map[key] ?? ''
      RtcClient.engine.sendUserBinaryMessage('RobotMan_', string2tlv(JSON.stringify({ ToolCallID: toolCallId, Content: content }), 'func'))
    },
  };

  return {
    parser: (buffer: ArrayBuffer) => {
      try {
        const { type, value } = tlv2String(buffer);
        maps[type as MESSAGE_TYPE]?.(JSON.parse(value) as AnyRecord);
      } catch (e: unknown) {
        logger.debug('parse error', e);
      }
    },
  };
};
