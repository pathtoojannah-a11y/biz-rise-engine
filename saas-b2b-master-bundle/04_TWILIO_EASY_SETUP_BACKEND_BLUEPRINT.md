# Twilio Easy Setup Blueprint (Do-Next, Not Implemented Yet)

## Goal
Make onboarding feel simple for local-service operators while keeping NexaOS operationally reliable.

## Recommended Model

Managed Twilio model:
1. NexaOS provisions and manages Twilio subaccounts/numbers
2. Customer keeps their existing business number and sets missed-call forwarding
3. NexaOS handles SMS workflow, webhooks, retries, and logging

## Customer Setup Flow (5-10 Minutes)

1. Enter business info and call-handling preferences
2. Click `Activate number`
3. Follow carrier-specific forwarding instructions
4. Run one test call
5. Go live

## Backend Components

1. Provisioning service
   - Create Twilio subaccount
   - Buy/assign number
   - Save credentials securely
2. Webhook handlers
   - Voice callback for missed/forwarded calls
   - Messaging callback for inbound SMS
   - Status callback for delivery updates
3. Lead workflow engine
   - Trigger first reply
   - Qualification prompt sequence
   - Dispatch card creation/update
4. Reliability controls
   - Idempotency by `CallSid` and `MessageSid`
   - Retry/backoff + dead-letter logging
5. Security controls
   - Twilio signature validation
   - Rate limiting
   - Structured audit logs

## API Contract (Proposed)

- `POST /api/onboarding/twilio/provision`
- `POST /api/onboarding/twilio/test`
- `POST /webhooks/twilio/voice`
- `POST /webhooks/twilio/sms`
- `POST /webhooks/twilio/status`

## Compliance Baseline

1. Handle `STOP`, `START`, `HELP`
2. Respect quiet hours/business hours
3. Keep consent and messaging context logs
4. Keep opt-out handling immediate and deterministic

## Why This Model

- Lowest customer setup friction
- Better supportability/debugging
- Faster activation and higher conversion to live usage

