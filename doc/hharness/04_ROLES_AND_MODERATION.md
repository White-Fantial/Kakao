# Roles and Moderation Policy

## Roles

### USER
일반 사용자.

가능한 작업:
- 글 작성
- 글 수정/삭제: 본인 글만
- 판매글 판매 완료 처리: 본인 글만
- 댓글 작성
- 본인 댓글 삭제
- 작성자 연락 버튼 사용

제한:
- LIMITED 상태에서는 새 글/댓글 작성 제한 가능
- SUSPENDED 상태에서는 로그인은 가능하더라도 작성/댓글/연락 기능 제한

### COORDINATOR
커뮤니티 운영 보조자.

가능한 작업:
- 게시글을 HELD 상태로 변경
- 댓글을 HELD 또는 DELETED 상태로 변경
- 보류된 글을 재게시 처리
- 문제가 있는 사용자에 대해 admin 검토 요청 생성
- moderation action log 작성

제한:
- 사용자를 영구 삭제하거나 영구 정지할 수 없음
- 최종 삭제/제한 결정은 admin만 가능

### ADMIN
최종 관리자.

가능한 작업:
- 모든 게시글 상태 변경
- 모든 댓글 상태 변경
- 사용자 제한/정지/복구/삭제 결정
- 카테고리/도시 관리
- coordinator 권한 부여/회수
- moderation log 확인

## Content Status Flow

### Normal Post Flow
1. USER creates post
2. Post status = PUBLISHED
3. Other users can view/comment/contact

### Moderation Flow
1. COORDINATOR sees problematic post
2. COORDINATOR changes post to HELD
3. Post disappears from public listing
4. COORDINATOR adds reason
5. COORDINATOR can restore if minor issue resolved
6. ADMIN can permanently delete or restore

### User Restriction Flow
1. COORDINATOR flags user for review
2. ADMIN reviews moderation history
3. ADMIN decides:
   - no action
   - LIMITED
   - SUSPENDED
   - DELETED

## Audit Requirements
Every moderation action should create a ModerationAction record.

Minimum log fields:
- actor
- target type
- target id
- action type
- reason
- timestamp

## UI Requirements

### Coordinator Dashboard
- List of recent posts
- Filter by HELD/PUBLISHED/DELETED
- Hold/restore buttons
- Reason input
- User review request button

### Admin Dashboard
- User list with status filter
- Post moderation queue
- Comment moderation queue
- Coordinator action history
- User restriction controls
- Category/city management
