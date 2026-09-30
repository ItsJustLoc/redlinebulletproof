# Redline contact delivery

The frontend remains a Next.js static export hosted on Cloudflare Pages.
The independent AWS backend is API Gateway HTTP API → Lambda → SES and also works if the frontend later moves to S3/CloudFront.
No Next.js server route, SMTP password, client API key, database, or mailto link is needed.

## Relationship to the NGV HLD

The reference is `NGV_HLD_v1.1.md` (draft, 2026-08-31), which describes the broader `ngv-inc.com` platform.
This Redline integration follows its API Gateway → Lambda → SES pattern and `us-east-2` region.
The current Redline scope retains name, email, phone, and description, and adds an inquiry-type selection.
The user approved launching with only the verified `nationalgvinyl@gmail.com` inbox and adding `ngvcorp22@gmail.com` after its verification.
It does not add the HLD's separate district fields, submitter acknowledgement, or DynamoDB retention.
Redline remains on its existing Cloudflare Pages deployment; an S3/CloudFront migration is a separate change.

This contact stack is described with AWS SAM/CloudFormation rather than the draft HLD's Terraform convention.
Keep one infrastructure owner for these resources.
If the broader NGV platform adopts Terraform, plan an explicit import/migration instead of creating duplicate resources alongside this stack.
The HLD proposes `noreply@ngv-inc.com`; Redline uses the user-approved `noreply@redlinebulletproof.com` sender.

## Email and validation behavior

- TO: `nationalgvinyl@gmail.com`.
- CC: none during the initial launch.
- From: `noreply@redlinebulletproof.com`, supplied as `SesFromEmail` during deployment.
- Reply-To: the validated visitor email.
- Subject: `Redline Bulletproof website inquiry`.
- Body: plain text containing name, email, phone, inquiry type, and an optional description.

Recipients are fixed in `backend/contact/handler.ts` and restricted again by IAM.
Unknown payload properties cannot override the recipients, sender, subject, or headers.
The visitor address is never used as From.
Replying to the notification in the business Gmail account addresses the visitor.
The visitor then replies to that business Gmail address, so the conversation can continue normally.
No automatic confirmation is sent to the visitor, and no receiving mailbox was created for the notification sender.
Plain-text mail keeps submitted markup inert.
The shared Zod schema trims fields, bounds lengths, validates email and phone, and rejects unsupported control characters while preserving message newlines.
Name, email, phone, and an inquiry choice are required in the current form.
The four choices are Product information, Request a quote, School-bus seating, and Other; arbitrary inquiry values are rejected by the server.
An empty, whitespace-only, or omitted description is accepted and appears as `No description provided.` in the notification.
Descriptions that are supplied retain the 5,000-character limit and control-character checks.
Phone validation checks 7–15 digits, common separators, at most one balanced pair of parentheses, and an optional leading `+`.
This checks formatting, not number assignment, country-specific validity, or email/phone ownership.
The browser validates fields on blur and revalidates reported errors while editing, without interrupting focus.
Submit-time validation still focuses the first rejected field.

Deploy the Lambda before the updated frontend.
The backend defaults an omitted inquiry to Other for cached clients from before this field existed, while rejecting an explicitly empty or unrecognized selection.
The frontend always sends and requires a selection, and both releases accept the existing description payload.
This allows the previous frontend to remain usable during rollout or frontend rollback.
Request bodies are capped at 32 KiB, including decoded API Gateway base64 requests.
Only JSON POSTs from configured exact origins are accepted.

The `website` honeypot is hidden from visitors and keyboard navigation.
A populated honeypot returns a success-shaped response without sending mail.
API Gateway limits the route to a steady rate of 1 request/second and burst of 5.
These are basic safeguards, not a comprehensive spam filter: bots can omit the honeypot and forge Origin outside a browser, and throttling is aggregate and best-effort, not per visitor.
If abuse appears, add a server-verified challenge before raising limits.

The client prevents concurrent submissions and disables edits while sending.
SES SDK retries are disabled because SendEmail does not offer an idempotency token.
The client aborts after 15 seconds and does not automatically retry.
A network failure can leave delivery uncertain; a manual retry can therefore create a duplicate email.
Fields clear only after a successful API response with `ok: true`.
For normal submissions, Lambda returns that response only after SES returns a MessageId.
This confirms provider acceptance, not final delivery to the inbox.

## Configuration

| Setting | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CONTACT_API_URL` | Frontend build | Full public API URL ending in `/contact`; not a secret |
| `NEXT_PUBLIC_SITE_URL` | Frontend build | Existing public site origin for metadata |
| `SesFromEmail` → `SES_FROM_EMAIL` | SAM parameter → Lambda | Verified plain sender mailbox, without a display name |
| `SesIdentity` | SAM parameter | Verified domain or email identity that owns the sender; used to scope IAM |
| `AllowedOrigins` → `ALLOWED_ORIGINS` | SAM parameter → API and Lambda | Comma-separated exact HTTPS origins; no paths or trailing slashes |
| `AWS_REGION` and role credentials | Lambda runtime | Provided by AWS; do not set static AWS keys |

The default allowed origins are the apex and www Redline domains plus `https://redlinebulletproof.pages.dev`.
Random Cloudflare preview subdomains are deliberately excluded.
For a preview, explicitly allow that exact HTTPS origin in the stack.
Do not use a wildcard.
Changing a `NEXT_PUBLIC_*` value requires rebuilding and redeploying `out/`; runtime environment changes cannot modify an existing static export.
Missing API configuration displays an unavailable notice and sends nothing.

## SES prerequisites

1. Sign in to the intended AWS account and choose the SES region.
2. Verify a sender domain or email identity in that region and select the actual From address.
   For a domain identity, publish the SES DKIM DNS records and follow its sender-authentication setup.
3. Check whether SES is in the sandbox and whether sending is enabled.
   In the sandbox, every active recipient mailbox must also be verified in that region; verification of only the sender is insufficient.
   Request production access before relying on delivery to unverified recipients.
   The visitor email is only Reply-To and does not need SES verification.
4. Deploy the backend in the same region as the verified identity.

The local profile `ngv` is configured for `us-east-2` in AWS account `527595306192`.
SSO access was refreshed and account configuration was inspected on 2026-09-30.
SES sending is enabled, but the account remains in the sandbox with a quota of 200 recipient deliveries per 24 hours and 1 per second.
Each accepted contact message currently has one recipient and consumes one recipient delivery.
Verification emails were requested for both destination mailboxes.
`nationalgvinyl@gmail.com` is verified; `ngvcorp22@gmail.com` remains pending and is excluded from both the handler and IAM permissions.
The sender domain `redlinebulletproof.com` is verified with SES Easy DKIM using 2048-bit keys.
Its three CNAME records are published as DNS-only records in the existing Cloudflare zone.
The existing DMARC policy and website records remain unchanged.
The existing account budget is `ngv-monthly-cost-budget`, with a USD 400 monthly limit; this is a budget alert threshold, not a spending cap.

```sh
aws sso login --profile ngv
aws sts get-caller-identity --profile ngv
aws sesv2 get-account --profile ngv --region us-east-2
aws sesv2 list-email-identities --profile ngv --region us-east-2
```

## Build and deploy the backend

Run from the repository root.
Use the AWS CLI and AWS SAM CLI with an authorized deployment role.
Use an installed SAM CLI or run it through `uvx --from aws-sam-cli sam`.
SAM CLI 1.166.2 was available through `uvx` during configuration.
`npm ci` installs the pinned build dependencies.
The bundled SDK and Zod code are deployed with the Lambda, independent of the runtime's bundled SDK version.

```sh
npm ci
npm test
npm run build:contact
sam validate --lint --template-file infra/contact/template.yaml --region us-east-2
sam deploy --guided --template-file infra/contact/template.yaml --profile ngv --region us-east-2
```

In guided deployment, choose stack name `redline-contact` and supply the verified `SesFromEmail` and `SesIdentity`.
For this deployment, use `noreply@redlinebulletproof.com` and `redlinebulletproof.com`, respectively.
`SesIdentity` is the verified domain (for example `your-domain.example`) or the exact verified email address, not its ARN.
Keep or deliberately update `AllowedOrigins`.
Review the change set and acknowledge `CAPABILITY_IAM`; the template creates the Lambda execution role and permits unauthenticated POSTs to this public contact endpoint.
The generated `samconfig.toml` and build output are ignored by Git.
Build the Lambda again before subsequent deployments.

The deployment principal needs CloudFormation stack/change-set permissions, artifact-bucket S3 access, permission to manage the template's API Gateway/Lambda/CloudWatch Logs resources, and IAM role/policy creation plus `iam:PassRole` for the function role.
Use a scoped deployment role or CloudFormation service role appropriate to the account; these provisioning permissions do not belong on Lambda itself.
SES identity verification and production-access requests require separate SES administration permissions.

The Lambda role has `ses:SendEmail` only for the selected regional sender identity and the exact verified recipient identity, with conditions limiting From and recipients, plus the SAM-generated basic CloudWatch logging permissions.
There are no SMTP or API credentials to provision in browser JavaScript.
The application logs the fixed event `contact_delivery_failed` and an allowlisted error code, not submissions, arbitrary error names, or raw provider messages.
CloudWatch logs have a 14-day retention period.
The backend does not persist form data; submitted personal details remain in the receiving mailboxes according to the business's mailbox retention/access policies.

## Configure and deploy the static site

Read the actual stack output after a successful deployment:

```sh
CONTACT_API_URL=$(aws cloudformation describe-stacks \
  --stack-name redline-contact --profile ngv --region us-east-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`ContactApiUrl`].OutputValue' --output text)

NEXT_PUBLIC_SITE_URL=https://redlinebulletproof.com \
NEXT_PUBLIC_CONTACT_API_URL="$CONTACT_API_URL" npm run build
npm run typecheck
npm run lint
npm test
NEXT_PUBLIC_CONTACT_API_URL="$CONTACT_API_URL" npm run test:e2e -- --workers=1
```

Inspect the URL returned by CloudFormation before using it.
The browser tests intercept API calls and do not send email, even when provided the production URL.
Deploy `out/` through the existing Cloudflare Direct Upload workflow documented in the README.
The AWS contact stack does not move the site, change DNS, or deploy Cloudflare Pages.
For an eventual S3/CloudFront host, keep using the same cross-origin API URL and update allowed origins as needed.

## Local verification without AWS

```sh
npm test
npm run build:contact
NEXT_PUBLIC_CONTACT_API_URL=https://contact-api.example.test/contact npm run build
NEXT_PUBLIC_CONTACT_API_URL=https://contact-api.example.test/contact npm run test:e2e -- --workers=1
npm run typecheck
npm run lint
# Remove the test URL from deployable output after testing:
npm run build
```

The contact browser tests run the actual Lambda validation and message construction with a fake SES transport for the acceptance case.
They also cover pending state, server validation, provider rejection, throttling, malformed responses, network failure, retry, and retained entries in desktop Chromium and mobile WebKit.
Unit tests cover the honeypot, header/control-character abuse, request limits, base64 input, unapproved origins, provider failures, and timeout behavior.
Local tests do not exercise AWS IAM, API Gateway preflight behavior, SES account configuration, or mailbox receipt.

### Implementation verification (2026-09-28)

- 48 unit tests passed.
- 49 browser tests passed, with 7 existing platform-specific skips, against a production static export with locally intercepted delivery.
- Lint, TypeScript, the static build, the Lambda bundle, and local `cfn-lint` validation of the SAM template passed.
- The generated Lambda bundle passed local validation/honeypot smoke checks without sending email.
- Desktop and mobile contact screenshots showed no overflow or clipped status text.
- Exported browser JavaScript was checked for recipient addresses and server-only SES configuration; none was found.
- The static export was rebuilt without the test API URL after connected-state testing.

No AWS resources or frontend production deployments were changed, and no email was sent during those local implementation checks.

### Backend configuration (2026-09-30)

- The implementation starts from GitHub `main` commit `ea5e84ff1501cf4a6eb067d78d1ee00f839c14ee`, on branch `codex/contact-aws-ses`.
- Cloudflare Pages project `redlinebulletproof` serves the apex and www domains.
- The pre-contact rollback deployment is `59e2dc0d-3ff3-47c3-a34f-e6b9f9b7a287`, built from `07ed27c`.
- SES identity `redlinebulletproof.com` and DKIM both report success; `nationalgvinyl@gmail.com` is verified and `ngvcorp22@gmail.com` remains pending.
- CloudFormation stack `redline-contact` is `UPDATE_COMPLETE` in `us-east-2`, with only `nationalgvinyl@gmail.com` allowed as a recipient.
- The public contact API is `https://z9dtk4xln3.execute-api.us-east-2.amazonaws.com/contact`.
- Lambda is `redline-contact-ContactFunction-etSDjRPx73nn`, with a 14-day log group and the fixed sender/recipient permissions in the template.
- SAM created its managed artifact bucket in the same region; there are no static AWS credentials in the frontend or Lambda configuration.
- Live API checks passed: allowed-origin preflight (204), invalid input (400), unapproved origin (403 with no CORS allowance), and a honeypot submission (200 without sending).
- IAM policy simulation permits the intended sender/recipients and denies a different sender or recipient.
- The earlier two-recipient configuration returned an honest 502 while `ngvcorp22@gmail.com` remained unverified; the user subsequently approved launching with just the verified inbox.
- 48 unit tests and 49 browser tests passed (7 existing platform-specific skips), alongside lint, typecheck, static export, Lambda bundle, SAM validation, and a dependency audit with zero production vulnerabilities.
- The browser tests intercepted delivery locally; live AWS checks were run separately.
- The exported browser JavaScript contains the actual API URL, with no fixed recipients, server-only SES configuration, or dummy API URL.
- The static frontend was built with the real API URL and published to Cloudflare Pages production as `1a1ac7e6-b7d5-4bf2-8371-81b4f514e4d8`, from application commit `fec82aa`.
- The latest single-recipient adjustment passed all 48 unit tests and all 14 contact browser tests, lint, typecheck, both builds, SAM validation, and an independent code review.
- The pending `ngvcorp22@gmail.com` inbox is denied by the deployed IAM policy and does not block the approved single-recipient launch.
- Live Lambda testing exposed an `AccessDeniedException` because SES also checked the verified recipient identity resource.
- Adding only that exact identity ARN resolved the failure; the same API submission then returned 200 with `ok: true` after SES acceptance.
- IAM simulation now covers both the sender-domain and recipient identity resources, permits the configured inbox, and rejects the pending inbox and an unrelated address.
- Safe error-code logging has a regression test that verifies private provider messages and unknown error names are never logged; all 49 unit tests pass.

### Production verification (2026-09-30)

The production site is `https://redlinebulletproof.com`, with the same release on the www domain.
A real browser submission named `Redline Live Website Test` showed the pending state, then success and cleared fields after the deployed API acknowledged SES acceptance.
No browser warnings or errors were captured during that live check.
The user confirmed receipt of the earlier direct SES diagnostic; receipt and header inspection of the final website-submitted message are awaiting confirmation.
These are distinct checks: the direct diagnostic did not exercise the Lambda role or the browser form.

### Inquiry choices and format validation release (2026-09-30)

- Application commit `5222e67` adds the four inquiry choices, optional description, and inline email/phone format checks.
- All 95 unit tests and 53 browser tests passed, with 7 existing platform-specific skips.
- Lint, typecheck, static export, Lambda bundle, SAM validation, and an independent review passed.
- After keeping the native select at 16px for mobile use, the final static export passed 25 targeted contact/accessibility browser checks, with 1 existing platform skip.
- The Lambda stack reached `UPDATE_COMPLETE` before the frontend release, with no IAM, recipient, or origin changes.
- Live API checks returned 400 for invalid email, phone, and inquiry values; a blank-description honeypot check returned 200 without sending mail.
- Cloudflare production deployment `6627d22a-1461-449e-aa1b-dadcba827e6c` serves the export from application commit `5222e67`.
- Both apex and www URLs expose the updated form.
- A real browser submission named `Redline Optional Description Test`, with School-bus seating selected and the description empty, showed Sending followed by success and cleared fields.
- That success confirms SES acceptance; inbox receipt and header inspection of this new test have not been independently confirmed.
- No browser warnings or errors were captured during the live check.

### Adding the second inbox later

The subsequent launch uses only `nationalgvinyl@gmail.com`, as explicitly approved by the user.
Do not automatically add the pending address when SES marks it verified.
When that follow-up change is requested, first confirm `ngvcorp22@gmail.com` verification with `list-email-identities`.
Restore the originally requested TO `ngvcorp22@gmail.com` and CC `nationalgvinyl@gmail.com` in the handler, add the address and its verified identity ARN back to the IAM policy, and update both recipient assertions in the unit/browser tests.
Rebuild and deploy the Lambda stack, then confirm receipt and headers in both inboxes.
This recipient-only change does not require a frontend rebuild because recipient addresses are kept server-side.

To undo the inquiry-form update, roll back Cloudflare Pages to `1a1ac7e6-b7d5-4bf2-8371-81b4f514e4d8` and leave the compatible contact backend intact.
Avoid deleting a stack or SES identity merely to undo a frontend release.

## Required live acceptance checks

After AWS and frontend deployment, submit one clearly labeled test inquiry through the real published form.
Verify the browser preflight and POST succeed from the actual site origin and that the form reports success only after the POST.
Confirm receipt in `nationalgvinyl@gmail.com` and inspect TO, the absence of CC, Reply-To, name, phone, email, inquiry type, and the optional description.
Confirm replying addresses the visitor, and check spam folders if delivery is delayed.
Monitor Lambda errors and SES delivery/bounce/complaint information; a MessageId alone is not inbox proof.
Do not mark delivery complete until these checks pass.

## Sources

- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports) and [build-time environment variables](https://nextjs.org/docs/app/guides/environment-variables).
- [AWS SAM HTTP API](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-httpapi.html).
- [SES SendEmail API](https://docs.aws.amazon.com/ses/latest/APIReference-V2/API_SendEmail.html) and [identity-scoped sending permissions](https://docs.aws.amazon.com/ses/latest/dg/control-user-access.html).
- [SES sandbox restrictions](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html) and [verified identities](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html).
- [Lambda runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html) and [AWS SAM CLI installation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).
