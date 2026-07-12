# Golden Pony English — Figma design proposal

## 1. Design direction

**Concept:** Warm editorial learning studio. The experience should feel friendly and motivating for students, while remaining efficient and information-dense for teachers.

- Brand character: warm, capable, youthful, not childish.
- Primary background: warm ivory `#F7F3EA`.
- Primary ink: deep navy `#142033`.
- Brand accent: honey gold `#E7A928`, derived from the pony mark.
- Secondary accent: sage `#6F8B78` for learning progress and success.
- Error: brick `#B94F45`.
- Display type: **Fraunces** or **Newsreader** for marketing and key milestones.
- UI type: **Manrope** for dashboards, forms, and learning content.
- Mono/data type: **IBM Plex Mono** for scores, bands, question indexes, and dates.
- Shape language: 18–24 px outer radii; 10–14 px controls; avoid pills except status/filter chips.
- Imagery: candid class moments, paper texture, marker annotations, and the golden pony used as a restrained seal rather than a large mascot everywhere.

## 2. Figma file structure

1. `00 Cover & Readme`
2. `01 Foundations`
3. `02 Components`
4. `03 Public website`
5. `04 Authentication`
6. `05 Student app`
7. `06 Teacher app`
8. `07 Responsive`
9. `08 Prototype flows`
10. `09 Archive / current UI`

Desktop frames use 1440 px with a 12-column grid, 80 px margins and 24 px gutters. Tablet uses 834 px / 8 columns. Mobile uses 390 px / 4 columns with 20 px margins. All application screens should also include a 1280 × 800 laptop frame because this is a realistic minimum viewport for the management UI.

## 3. Foundations and variables

Create Figma variables for color, spacing, radius, typography, shadow, border, and motion. Provide `Light` plus `High contrast` modes. Use an 8 px spacing base with optical exceptions at 6, 10, 14, and 20 px.

The component library should include:

- App header, public header, mobile navigation, profile menu.
- Buttons: primary, secondary, quiet, danger, icon; default/hover/pressed/focus/disabled/loading.
- Text field, password, search, textarea, select, number, date-time, checkbox, radio.
- Tabs, segmented control, filter chip, badge, status lozenge.
- Course card, lesson row, test row, vocabulary row, stat tile.
- Progress bar/ring, score display, question palette, quiz option.
- Toast, inline alert, skeleton, empty state, confirmation dialog, side sheet.
- Pagination, breadcrumbs, table/list toolbar, sticky action bar.
- Content blocks: heading, body, callout, quote, grammar exercise.

## 4. Public website frames

### Landing page

1. Header with logo, Roadmap, Courses, About Julia, FAQ, and a clear `Đăng nhập` action.
2. Hero with one strong promise, tutor portrait/classroom image, two proof points, and `Xem lộ trình` as the primary CTA.
3. Proof strip for class size, feedback rhythm, and roadmap range.
4. Interactive IELTS roadmap; selecting a level opens a side sheet with input/output band, sessions, tuition, and consultation CTA.
5. Course catalogue using an asymmetric editorial grid; course detail opens a side sheet.
6. About Julia with credentials and experience timeline.
7. FAQ and course policy as searchable topic rows rather than a long generic accordion.
8. Consultation CTA, concise footer, contact channels, privacy and terms.

Required states: roadmap selected/unselected, course detail sheet, FAQ expanded, mobile navigation open, contact hover/focus, loading image, 404.

## 5. Authentication frames

- Login — teacher preset.
- Login — student preset.
- Empty validation, invalid email, wrong password, submitting, API unavailable.
- Mobile login.

Remove developer-facing Spring/Next.js endpoint information from the customer login screen. Replace it with a useful trust statement or support contact.

## 6. Student app frames

### Student dashboard

- Greeting and “continue learning” hero.
- Current assignments ordered by urgency.
- Weekly activity and recent score summary.
- Quick links to Foundation, Vocabulary, and Tests.
- Empty, loading, offline, and error states.

### Foundation course

- Course selector and progress overview.
- Unit/lesson roadmap with locked, not started, in progress, and completed states.
- Lesson reader with heading, text, callout, quote, and embedded grammar exercise blocks.
- Sticky previous/next and complete-lesson actions.
- Completion celebration and next lesson recommendation.

### Vocabulary

- Assigned set library with progress and deadline.
- Set overview and daily target.
- Learn card: word, phonetic, part of speech, meanings, example.
- Multiple-choice practice, answer feedback, session result, retry errors.
- Search/filter and empty assignment state.

### Tests

- Test library with status, duration, question count, progress, and score.
- Test introduction/requirements.
- Quiz player with question palette, single-choice answer, previous/next, autosave, and timer-ready layout.
- Submit confirmation, incomplete warning, submitting, result summary, answer review.

## 7. Teacher app frames

### Teacher dashboard

- Overview for classes, students, open tests, and assignments needing attention.
- Recent tests and activity feed.
- Primary create action and shortcuts to Foundation, Vocabulary, and Tests.

### Test management

- Test list with search, status filter, draft/published states, edit and delete.
- New/edit test builder.
- Question composer with single-choice options, correct answer, scoring, reordering, validation.
- Publish confirmation and preview student mode.

### Vocabulary management

- Set list and selected-set workspace.
- Create/edit metadata; draft/published status.
- Add word manually; edit/delete word; search; pagination.
- Assignment panel for title, deadline, daily target, audience selection.
- Assignment list and student progress detail.
- Empty set, no search result, saving, delete confirmation, and API error states.

### Foundation builder

- Course list and create course.
- Course metadata and publish state.
- Unit and lesson hierarchy.
- Block editor supporting heading, text, callout, quote, grammar exercise.
- Drag/reorder affordance, delete confirmation, autosave/saving feedback.
- Student preview as a dedicated side-by-side mode.

### Grammar exercise builder

- Exercise metadata.
- Question type and answer authoring.
- Mini-quiz composition, scoring, preview, validation, publish state.

## 8. Main prototype flows

1. Visitor → roadmap level → course detail → consultation.
2. Student login → dashboard → continue Foundation lesson → grammar exercise → complete lesson.
3. Student dashboard → assigned vocabulary → practice → result.
4. Student dashboard → test → answer questions → incomplete warning → submit → review result.
5. Teacher login → create test → add questions → preview → publish.
6. Teacher → vocabulary set → add/edit words → assign to students → view progress.
7. Teacher → Foundation builder → create unit/lesson/block → reorder → preview → publish.

## 9. Recommended first presentation

For stakeholder review, present these six key frames first:

1. Landing hero and roadmap at 1440 px.
2. Login at 1440 px.
3. Student dashboard at 1280 × 800.
4. Student lesson player at 1280 × 800.
5. Teacher dashboard at 1280 × 800.
6. Teacher vocabulary workspace at 1440 × 900.

After direction approval, expand the chosen visual language to all frames and states above. This prevents polishing dozens of screens before the brand and information hierarchy are accepted.

## 10. Audit notes from the current product

- The product already contains the core public, student, and teacher routes, but visual hierarchy is dominated by repeated white bordered cards.
- Indigo gradients and pill buttons make the interface feel more like a generic SaaS template than a personal IELTS studio.
- Teacher builders need clearer hierarchy, denser controls, sticky actions, and stronger draft/published feedback.
- Student experiences need a more visible “next best action,” better progress storytelling, and more deliberate completion feedback.
- Several text strings appear to have encoding inconsistencies; normalize all interface copy to UTF-8 before final design handoff.
- Customer-facing screens should not expose implementation details or placeholder contact links.

