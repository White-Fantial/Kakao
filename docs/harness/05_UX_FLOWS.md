# UX Flows

## Mobile-first Principle
이 서비스는 카카오톡 오픈채팅방을 대체/보완하는 성격이므로 모바일 사용성을 최우선으로 한다.

## Home / Feed
### Default Feed
- 최신 글 목록
- 상단 필터:
  - 도시 선택
  - 카테고리 선택
- 글 카드 표시:
  - 카테고리 badge
  - 도시 badge
  - 제목이 있으면 제목 표시
  - 제목이 없으면 본문 첫 줄을 더 크게 표시
  - 사진 썸네일
  - 가격 if sale post
  - SOLD badge if sold
  - 댓글 수
  - 작성 시간

## Post Creation
### Kakao-style Composer
- 큰 본문 입력창 중심
- 제목은 “제목 추가하기” 옵션으로 숨겨둘 수 있음
- 카테고리 선택 필수
- 도시 선택 필수
- 사진 추가 버튼
- 카테고리가 “팔아요”이면 가격 입력 표시
- 카테고리가 “무료나눔”이면 가격 입력 숨김 또는 0 처리

### Validation
- body required
- category required
- city required
- price required only for sale category if configured

## Post Detail
- 카테고리 / 도시 / 작성 시간
- 제목 if exists
- 본문
- 이미지 gallery
- 가격 if sale post
- 판매 완료 badge if sold
- 댓글 목록
- 댓글 작성창
- 작성자에게 카카오로 연락 버튼

## My Posts
- 내가 쓴 글 목록
- 수정
- 삭제
- 판매 완료 처리
- 판매 완료 취소 가능 여부는 설정으로 결정

## Contact Button
MVP text:
- “카카오톡으로 연락하기”
- openChatUrl이 없을 경우:
  - “작성자가 연락 링크를 등록하지 않았어요.”

## Empty States
### No posts
“아직 올라온 글이 없어요. 첫 글을 남겨보세요.”

### No filtered result
“선택한 지역/카테고리에 맞는 글이 없어요.”

## Language
초기 서비스 언어는 한국어를 기본으로 한다.
코드 내부 enum, route, DB field는 영어를 사용한다.
UI copy는 한국어로 관리한다.
