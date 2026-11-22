import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const callId = searchParams.get('callId');

    // 1. Check for incoming calls for this user
    if (userId) {
      const activeCallRecord = await prisma.systemSetting.findUnique({
        where: { key: `active_call_${userId}` },
      });

      if (activeCallRecord) {
        try {
          const callData = JSON.parse(activeCallRecord.value);
          // If call was created less than 45 seconds ago, it is active
          if (Date.now() - callData.timestamp < 45000) {
            return NextResponse.json({
              hasIncomingCall: true,
              call: callData,
            });
          } else {
            // Expired call, clean it up
            await prisma.systemSetting.delete({ where: { key: `active_call_${userId}` } }).catch(() => {});
          }
        } catch (e) {}
      }

      return NextResponse.json({ hasIncomingCall: false });
    }

    // 2. Check call state & signaling for an ongoing call
    if (callId) {
      const callDataRecord = await prisma.systemSetting.findUnique({
        where: { key: `call_data_${callId}` },
      });

      if (!callDataRecord) {
        return NextResponse.json({ status: 'ended' });
      }

      const call = JSON.parse(callDataRecord.value);
      return NextResponse.json({ call });
    }

    return NextResponse.json({ error: 'Missing userId or callId' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Signaling error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, callId, userId, recipientId, callerName, callerAvatar, type, conversationId, sdp, candidate, senderRole } = body;

    // Action 1: Initiate / Start Call
    if (action === 'start') {
      const newCallId = callId || `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const callMeta = {
        callId: newCallId,
        conversationId,
        callerId: userId,
        callerName: callerName || 'Caller',
        callerAvatar: callerAvatar || null,
        recipientId,
        type: type || 'video',
        status: 'ringing',
        timestamp: Date.now(),
      };

      const callData = {
        id: newCallId,
        ...callMeta,
        offer: null,
        answer: null,
        callerIce: [],
        recipientIce: [],
        status: 'ringing',
      };

      // Set active call notification for recipient
      await prisma.systemSetting.upsert({
        where: { key: `active_call_${recipientId}` },
        update: { value: JSON.stringify(callMeta) },
        create: { key: `active_call_${recipientId}`, value: JSON.stringify(callMeta) },
      });

      // Save full call signaling state
      await prisma.systemSetting.upsert({
        where: { key: `call_data_${newCallId}` },
        update: { value: JSON.stringify(callData) },
        create: { key: `call_data_${newCallId}`, value: JSON.stringify(callData) },
      });

      return NextResponse.json({ success: true, callId: newCallId, call: callData });
    }

    // Action 2: Send Offer (Caller -> Recipient)
    if (action === 'offer') {
      const record = await prisma.systemSetting.findUnique({
        where: { key: `call_data_${callId}` },
      });
      if (record) {
        const call = JSON.parse(record.value);
        call.offer = sdp;
        await prisma.systemSetting.update({
          where: { key: `call_data_${callId}` },
          data: { value: JSON.stringify(call) },
        });
      }
      return NextResponse.json({ success: true });
    }

    // Action 3: Send Answer (Recipient -> Caller)
    if (action === 'answer') {
      const record = await prisma.systemSetting.findUnique({
        where: { key: `call_data_${callId}` },
      });
      if (record) {
        const call = JSON.parse(record.value);
        call.answer = sdp;
        call.status = 'connected';
        await prisma.systemSetting.update({
          where: { key: `call_data_${callId}` },
          data: { value: JSON.stringify(call) },
        });

        // Clear incoming ring for recipient
        await prisma.systemSetting.delete({
          where: { key: `active_call_${call.recipientId}` },
        }).catch(() => {});
      }
      return NextResponse.json({ success: true });
    }

    // Action 4: Send ICE candidate
    if (action === 'ice-candidate') {
      const record = await prisma.systemSetting.findUnique({
        where: { key: `call_data_${callId}` },
      });
      if (record && candidate) {
        const call = JSON.parse(record.value);
        if (senderRole === 'recipient') {
          call.recipientIce = call.recipientIce || [];
          call.recipientIce.push(candidate);
        } else {
          call.callerIce = call.callerIce || [];
          call.callerIce.push(candidate);
        }
        await prisma.systemSetting.update({
          where: { key: `call_data_${callId}` },
          data: { value: JSON.stringify(call) },
        });
      }
      return NextResponse.json({ success: true });
    }

    // Action 5: End / Reject Call
    if (action === 'end' || action === 'reject') {
      if (callId) {
        const record = await prisma.systemSetting.findUnique({
          where: { key: `call_data_${callId}` },
        });
        if (record) {
          const call = JSON.parse(record.value);
          call.status = action === 'reject' ? 'rejected' : 'ended';
          await prisma.systemSetting.update({
            where: { key: `call_data_${callId}` },
            data: { value: JSON.stringify(call) },
          });

          // Clean recipient ringing state
          if (call.recipientId) {
            await prisma.systemSetting.delete({
              where: { key: `active_call_${call.recipientId}` },
            }).catch(() => {});
          }
        }
      }

      if (recipientId) {
        await prisma.systemSetting.delete({
          where: { key: `active_call_${recipientId}` },
        }).catch(() => {});
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown signaling action' }, { status: 400 });
  } catch (error: any) {
    console.error('Call signal error:', error);
    return NextResponse.json({ error: error?.message || 'Call signal processing failed' }, { status: 500 });
  }
}
