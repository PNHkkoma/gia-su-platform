'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Award, BookOpenCheck, ChevronDown, GraduationCap, MessageSquareText, Mic2, Route, ShieldCheck, Users, X, type LucideIcon } from 'lucide-react';
import { AppHeader } from './components/AppHeader';

type Highlight = {
  value: string;
  label: string;
  description: string;
  Icon: LucideIcon;
};

type RoadmapStep = {
  level: string;
  inputBand: string;
  outputBand: string;
  description: string;
  sessions: string;
  price: string;
  detail: string;
};

type Course = {
  title: string;
  inputBand: string;
  outputBand: string;
  sessions: string;
  price: string;
  benefits: string[];
  skills: string[];
  curriculum: string[];
  suitableFor: string;
};

type Faq = {
  question: string;
  answer: string;
};

const CONTACT = {
  phone: '0842 499 829',
  email: 'juliaphung02@gmail.com',
  address: 'Mỹ Đình, Hà Nội',
  website: 'goldenponyenglish.com',
};

const HIGHLIGHTS: Highlight[] = [
  {
    value: '4+',
    label: 'năm kinh nghiệm',
    description: 'Dạy 1-1, nhóm nhỏ, ôn thi chuyển cấp, Cambridge và IELTS.',
    Icon: Award,
  },
  {
    value: '5-8',
    label: 'học viên mỗi lớp',
    description: 'Sĩ số gọn để giáo viên theo sát nhịp học và bài tập.',
    Icon: Users,
  },
  {
    value: '0-7.0+',
    label: 'IELTS roadmap',
    description: 'Lộ trình từ mất gốc tới luyện đề chuyên sâu.',
    Icon: Route,
  },
  {
    value: '1-1',
    label: 'chấm chữa cá nhân hóa',
    description: 'Phản hồi bài viết, bài nói và lỗi band điểm theo từng học viên.',
    Icon: MessageSquareText,
  },
];

const ROADMAP: RoadmapStep[] = [
  {
    level: 'Foundation 1',
    inputBand: '0',
    outputBand: '2.0',
    description: 'Xây nền từ con số 0 với ngữ pháp, từ vựng và phát âm cơ bản.',
    sessions: '20 buổi',
    price: '1.500.000 vnd',
    detail: 'Phù hợp học viên mất gốc, cần lấy lại thói quen học và khung ngôn ngữ nền tảng.',
  },
  {
    level: 'Foundation 2',
    inputBand: '2.0',
    outputBand: '3.0',
    description: 'Củng cố nền, luyện câu phức, liên kết ý và phản xạ nói ngắn.',
    sessions: '25 buổi',
    price: '2.500.000 vnd',
    detail: 'Tập trung mở rộng ngữ pháp trung cấp, từ vựng gần gũi và phát âm tự nhiên hơn.',
  },
  {
    level: 'IELTS Basic',
    inputBand: '3.0',
    outputBand: '4.0',
    description: 'Làm quen format IELTS, chiến thuật Listening, Reading và nền Writing, Speaking.',
    sessions: '30 buổi',
    price: '3.500.000 vnd',
    detail: 'Học viên bắt đầu xử lý dạng bài, tìm keyword, paraphrase và luyện phản xạ speaking cơ bản.',
  },
  {
    level: 'Level A',
    inputBand: '4.0',
    outputBand: '5.0',
    description: 'Ổn định Reading, Listening, xử lý Writing và thực hành Speaking theo nhóm nhỏ.',
    sessions: '32 buổi',
    price: '3.900.000 vnd',
    detail: 'Tập trung tăng độ chính xác, cách tự học hiệu quả và chấm chữa bài viết về nhà.',
  },
  {
    level: 'Level B',
    inputBand: '5.0',
    outputBand: '6.0+',
    description: 'Tăng band Writing và Speaking bằng luyện đề, sửa bài và feedback trực tiếp.',
    sessions: '35 buổi',
    price: '6.000.000 vnd',
    detail: 'Dành cho học viên đã nắm format, cần tư duy viết mạch lạc và nói đúng tiêu chí chấm.',
  },
  {
    level: 'Level C',
    inputBand: '6.0',
    outputBand: '7.0+',
    description: 'Luyện đề chuyên sâu, mock test, forecast và sửa bài chi tiết.',
    sessions: '40 buổi',
    price: '14.000.000 vnd',
    detail: 'Tập trung xử lý band 6.5-7.0+, phát triển ý, quản lý thời gian và chiến thuật khi gặp đề khó.',
  },
];

const COURSES: Course[] = [
  {
    title: 'IELTS Tutor 1-1 C? b?n',
    inputBand: '0',
    outputBand: '5.0',
    sessions: 'To?n kh?a',
    price: '11.500.000 vnd',
    benefits: ['K?m ri?ng', 'X?y n?n IELTS', 'Ch?m ch?a s?u'],
    skills: ['Grammar', 'Reading', 'Listening', 'Speaking', 'Writing'],
    curriculum: ['?n n?n Foundation v? IELTS Basic', 'Luy?n k? n?ng theo ?i?m y?u c? nh?n', 'Ch?m ch?a b?i chuy?n s?u'],
    suitableFor: 'H?c vi?n m?t g?c ho?c c?n k?m s?t ?? l?n band 5.0.',
  },
  {
    title: 'IELTS Tutor 1-1 Chuy?n s?u',
    inputBand: '5.0',
    outputBand: '6.5+',
    sessions: 'To?n kh?a',
    price: '7.500.000 vnd',
    benefits: ['Luy?n thi c? nh?n', 'S?a l?i band', 'T?ng t?c'],
    skills: ['Writing', 'Speaking', 'Test strategy'],
    curriculum: ['Ph?n t?ch l?i band ?i?m', 'Luy?n ?? theo m?c ti?u', 'Feedback tr?c ti?p t?ng bu?i'],
    suitableFor: 'H?c vi?n ?? c? n?n 5.0 v? mu?n t?ng t?c l?n 6.5+.',
  },
  {
    title: 'IELTS Tutor 1-1 L? bu?i',
    inputBand: 'Linh ho?t',
    outputBand: 'Theo m?c ti?u',
    sessions: '1 bu?i / 2h',
    price: '350k / bu?i',
    benefits: ['G? r?i nhanh', 'S?a b?i tr?c ti?p', 'L?ch linh ho?t'],
    skills: ['Theo nhu c?u', 'Writing', 'Speaking'],
    curriculum: ['Ch?n ?o?n v?n ?? ch?nh', 'S?a b?i ho?c luy?n n?i t?i bu?i', 'G?i ? k? ho?ch t? h?c ti?p theo'],
    suitableFor: 'H?c vi?n c?n x? l? nhanh m?t k? n?ng, m?t b?i vi?t ho?c m?t bu?i speaking.',
  },
  {
    title: 'Foundation 1',
    inputBand: '0',
    outputBand: '2.0',
    sessions: '20 bu?i',
    price: '1.500.000 vnd',
    benefits: ['Ng? ph?p g?c', 'IPA c? b?n', 'T? v?ng ??i s?ng'],
    skills: ['Grammar', 'Vocabulary', 'Pronunciation'],
    curriculum: ['C?c th? v? c?u tr?c c?u c? b?n', 'T? v?ng ch? ?? ??i s?ng', 'IPA, nguy?n ?m, ph? ?m'],
    suitableFor: 'H?c vi?n m?t g?c ho?c m?i b?t ??u h?c l?i ti?ng Anh.',
  },
  {
    title: 'Foundation 2',
    inputBand: '2.0',
    outputBand: '3.0',
    sessions: '25 bu?i',
    price: '2.500.000 vnd',
    benefits: ['C?u ph?c', 'Li?n k?t ?', 'Ph?t ?m t? nhi?n'],
    skills: ['Grammar', 'Vocabulary', 'Pronunciation'],
    curriculum: ['M?nh ?? quan h?, c?u ?i?u ki?n, b? ??ng', 'Li?n k?t v? m? r?ng c?u tr? l?i', 'Ph?t ?m Anh-Anh v? Anh-M?'],
    suitableFor: 'H?c vi?n ?? c? n?n c? b?n v? c?n chu?n b? v?o IELTS.',
  },
  {
    title: 'IELTS Basic',
    inputBand: '3.0',
    outputBand: '4.0',
    sessions: '30 bu?i',
    price: '3.500.000 vnd',
    benefits: ['Format IELTS', 'Reading & Listening', 'N?n Speaking'],
    skills: ['Listening', 'Reading', 'Speaking', 'Writing'],
    curriculum: ['Chi?n thu?t x? l? d?ng b?i', 'T?m keyword v? nh?n di?n paraphrase', 'Brainstorming v? ?o?n v?n ng?n'],
    suitableFor: 'H?c vi?n b?t ??u l?m quen format IELTS t? A ??n Z.',
  },
  {
    title: 'Level A',
    inputBand: '4.0',
    outputBand: '5.0',
    sessions: '32 bu?i',
    price: '3.900.000 vnd',
    benefits: ['7 d?ng Writing', 'Luy?n n?i nh?m', 'B?i v? nh?'],
    skills: ['Listening', 'Reading', 'Speaking', 'Writing'],
    curriculum: ['X? l? d?ng c?u h?i Reading, Listening', 'D?n ? Writing Task 1 v? Task 2', 'Thu ?m speaking v? ???c nh?n x?t'],
    suitableFor: 'H?c vi?n c?n ?n ??nh band 5.0 v? bi?t c?ch t? h?c hi?u qu?.',
  },
  {
    title: 'Level B',
    inputBand: '5.0',
    outputBand: '6.0+',
    sessions: '35 bu?i',
    price: '6.000.000 vnd',
    benefits: ['Writing chuy?n s?u', 'Speaking strategy', 'S?a b?i m?i bu?i'],
    skills: ['Writing', 'Speaking', 'Exam strategy'],
    curriculum: ['T? duy vi?t h?c thu?t m?ch l?c', 'Luy?n speaking theo ti?u ch? ch?m', 'S?a l?i tr?c ti?p m?i bu?i'],
    suitableFor: 'H?c vi?n ?? hi?u format v? mu?n n?ng Writing, Speaking l?n r? r?t.',
  },
  {
    title: 'Level C',
    inputBand: '6.0',
    outputBand: '7.0+',
    sessions: '40 bu?i',
    price: '14.000.000 vnd',
    benefits: ['Mock test', 'Forecast', '20 b?i Writing'],
    skills: ['Advanced Writing', 'Advanced Speaking', 'Mock test'],
    curriculum: ['Luy?n ?? forecast v? mock test', 'Ph?t tri?n ? band 6.5-7.0+', 'Ch?m ch?a chi ti?t g?i 20 b?i vi?t'],
    suitableFor: 'H?c vi?n m?c ti?u 6.5-7.0+ c?n luy?n ?? v? t?i ?u chi?n thu?t.',
  },
];

const JULIA_CREDENTIALS: Array<{ title: string; detail: string; Icon: LucideIcon }> = [
  {
    title: 'Master student',
    detail: 'Lý luận và Phương pháp giảng dạy tiếng Anh.',
    Icon: GraduationCap,
  },
  {
    title: 'ULIS English Pedagogy',
    detail: 'Cử nhân Sư phạm Tiếng Anh, ĐH Ngoại Ngữ - ĐHQGHN.',
    Icon: BookOpenCheck,
  },
  {
    title: 'C1 proficiency',
    detail: 'Chuẩn đầu ra C1, bậc 5 khung năng lực 6 bậc.',
    Icon: ShieldCheck,
  },
];

const JULIA_EXPERIENCE = [
  {
    period: '4+ năm',
    title: 'Dạy 1-1 và nhóm nhỏ',
    detail: 'Theo sát học viên, ôn thi chuyển cấp và lộ trình cá nhân hóa.',
  },
  {
    period: 'IELTS / Cambridge',
    title: 'Chứng chỉ và luyện thi',
    detail: 'Có kinh nghiệm ôn Cambridge, IELTS, B1, B2 cho nhiều trình độ.',
  },
  {
    period: 'Debate',
    title: 'Public speaking',
    detail: 'Dạy tranh biện và thuyết trình, giúp học viên nói tự tin hơn.',
  },
];

const FAQS: Faq[] = [
  {
    question: 'Điều kiện cam kết đầu ra là gì?',
    answer: 'Cam kết được áp dụng khi học viên đạt đầu vào, học đều, làm bài đầy đủ và hoàn thành kiểm tra cuối khóa.',
  },
  {
    question: 'Được nghỉ tối đa bao nhiêu buổi?',
    answer: 'Mỗi khóa nên nghỉ không quá 2 buổi để giữ nhịp học và đảm bảo mục tiêu đầu ra.',
  },
  {
    question: 'Bài tập về nhà có bắt buộc không?',
    answer: 'Có. Bài tập giúp cô Julia theo dõi lỗi và cá nhân hóa phần feedback cho từng bạn.',
  },
  {
    question: 'Có kiểm tra cuối khóa không?',
    answer: 'Có. Bài kiểm tra cuối khóa giúp đo tiến bộ và xác định lộ trình tiếp theo.',
  },
  {
    question: 'Chính sách bảo lưu thế nào?',
    answer: 'Học viên có lý do cá nhân có thể bảo lưu tối đa 1 tháng.',
  },
  {
    question: 'Quy định xin nghỉ học?',
    answer: 'Hãy báo trước ít nhất 4 tiếng để lớp sắp xếp và hỗ trợ bù bài phù hợp.',
  },
  {
    question: 'Học phí có hoàn lại không?',
    answer: 'Sau khi khóa học bắt đầu, học phí không hoàn lại, trừ trường hợp giáo viên chủ động hủy khóa.',
  },
];

function SectionHeader({ title, description, align = 'default' }: { title: string; description: string; align?: 'default' | 'left' | 'compact' }) {
  const className = align === 'left' ? 'landing-section-head left' : align === 'compact' ? 'landing-section-head compact' : 'landing-section-head';

  return (
    <div className={className}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="landing-hero" id="hero">
      <div className="landing-hero-shape shape-one" />
      <div className="landing-hero-shape shape-two" />
      <div className="landing-hero-shape shape-three" />

      <div className="landing-container landing-hero-grid">
        <div className="landing-hero-copy">
          <div className="eyebrow">Golden Pony English</div>
          <h1>Học IELTS cùng Golden Pony English</h1>
          <p>Học xịn - vibe chill - tiếng Anh lên skill</p>
          <div className="actions landing-actions">
            <a className="btn primary" href="#roadmap">Xem lộ trình</a>
            <a className="btn" href={`mailto:${CONTACT.email}`}>Đăng ký học thử</a>
          </div>
        </div>

        <div className="card landing-hero-card">
          <div className="landing-teacher-card">
            <div className="landing-teacher-avatar">
              <img alt="Avatar cô Julia" src="/golden-pony.png" />
            </div>
            <div>
              <span>Teacher</span>
              <strong>Cô Julia</strong>
              <p>GenZ tutor, IELTS roadmap, lớp nhóm nhỏ 5-8 học viên.</p>
            </div>
          </div>

          <div className="landing-hero-card-copy">
            <span>IELTS Roadmap</span>
            <strong>0 tới 7.0+</strong>
            <small>Foundation, Basic, Level A, B, C và Tutor 1-1</small>
          </div>
        </div>
      </div>
    </section>
  );
}


function HighlightsSection() {
  return (
    <section className="landing-section landing-highlights-section" id="highlights">
      <div className="landing-container landing-highlight-grid">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.Icon;

          return (
            <article className="card landing-highlight-card" key={item.label}>
              <span className="landing-highlight-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={2.1} />
              </span>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <p>{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}


function RoadmapSection() {
  const [activeLevel, setActiveLevel] = useState<RoadmapStep | null>(null);
  const selectedLevel = activeLevel ?? ROADMAP[0];

  return (
    <section className="landing-section landing-roadmap-section" id="roadmap">
      <div className="landing-container">
        <SectionHeader
          title="IELTS Roadmap"
          description="Chọn từng level để xem đầu vào, đầu ra, số buổi và học phí dự kiến."
        />

        <div className="landing-roadmap-shell">
          <div className="landing-roadmap-line" aria-hidden="true" />
          <div className="landing-roadmap">
            {ROADMAP.map((step, index) => {
              const isActive = selectedLevel.level === step.level;

              return (
                <button
                  className={isActive ? 'landing-roadmap-item active' : 'landing-roadmap-item'}
                  key={step.level}
                  onClick={() => setActiveLevel(step)}
                  type="button"
                >
                  <span className="landing-roadmap-index">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <span className="landing-roadmap-band">{step.inputBand} - {step.outputBand}</span>
                    <h3>{step.level}</h3>
                  </div>
                  <p>{step.description}</p>
                  <div className="landing-roadmap-meta">
                    <span>{step.sessions}</span>
                    <strong>{step.price}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeLevel ? (
        <div className="landing-roadmap-overlay" role="presentation" onClick={() => setActiveLevel(null)}>
          <aside
            aria-modal="true"
            className="landing-roadmap-drawer"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="landing-roadmap-close" onClick={() => setActiveLevel(null)} type="button" aria-label="Đóng chi tiết level">
              <X size={18} strokeWidth={2.2} />
            </button>
            <span className="landing-roadmap-drawer-kicker">IELTS Level</span>
            <h3>{activeLevel.level}</h3>
            <p>{activeLevel.detail}</p>
            <div className="landing-roadmap-detail-grid">
              <div><span>Input</span><strong>{activeLevel.inputBand}</strong></div>
              <div><span>Output</span><strong>{activeLevel.outputBand}</strong></div>
              <div><span>Số buổi</span><strong>{activeLevel.sessions}</strong></div>
              <div><span>Học phí</span><strong>{activeLevel.price}</strong></div>
            </div>
            <a className="btn primary" href={`mailto:${CONTACT.email}`}>Đăng ký tư vấn level này</a>
          </aside>
        </div>
      ) : null}
    </section>
  );
}


function CourseCardsSection() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  return (
    <section className="landing-section landing-courses-section" id="courses">
      <div className="landing-container">
        <SectionHeader
          align="compact"
          title="Course Cards"
          description="Các gói học IELTS và tutor 1-1 được tóm tắt gọn để học viên chọn nhanh."
        />
        <div className="landing-course-grid">
          {COURSES.map((course) => (
            <article className="card landing-course-card" key={course.title}>
              <div className="landing-course-topline">
                <span>{course.inputBand} - {course.outputBand}</span>
                <small>{course.sessions}</small>
              </div>
              <h3>{course.title}</h3>
              <div className="landing-course-benefits">
                {course.benefits.map((benefit) => <span key={benefit}>{benefit}</span>)}
              </div>
              <div className="landing-course-footer">
                <strong>{course.price}</strong>
                <button className="landing-course-cta" onClick={() => setSelectedCourse(course)} type="button">Xem chi tiết</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selectedCourse ? (
        <div className="landing-course-overlay" role="presentation" onClick={() => setSelectedCourse(null)}>
          <aside
            aria-modal="true"
            className="landing-course-drawer"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="landing-roadmap-close" onClick={() => setSelectedCourse(null)} type="button" aria-label="Đóng chi tiết khóa học">
              <X size={18} strokeWidth={2.2} />
            </button>
            <span className="landing-course-drawer-kicker">Course detail</span>
            <h3>{selectedCourse.title}</h3>
            <div className="landing-course-detail-grid">
              <div><span>Input</span><strong>{selectedCourse.inputBand}</strong></div>
              <div><span>Output</span><strong>{selectedCourse.outputBand}</strong></div>
              <div><span>Học phí</span><strong>{selectedCourse.price}</strong></div>
              <div><span>Số buổi</span><strong>{selectedCourse.sessions}</strong></div>
            </div>
            <div className="landing-course-detail-block">
              <span>Skills covered</span>
              <div className="landing-course-skills">
                {selectedCourse.skills.map((skill) => <strong key={skill}>{skill}</strong>)}
              </div>
            </div>
            <div className="landing-course-detail-block">
              <span>Curriculum</span>
              <ul>
                {selectedCourse.curriculum.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="landing-course-detail-block">
              <span>Suitable for whom</span>
              <p>{selectedCourse.suitableFor}</p>
            </div>
            <a className="btn primary" href={`mailto:${CONTACT.email}`}>Đăng ký tư vấn</a>
          </aside>
        </div>
      ) : null}
    </section>
  );
}


function AboutJuliaSection() {
  return (
    <section className="landing-section landing-about-section" id="about-julia">
      <div className="landing-container landing-about-grid">
        <div className="landing-about-portrait card">
          <div className="landing-about-avatar-ring">
            <img alt="Avatar cô Julia" src="/golden-pony.png" />
          </div>
          <div className="landing-about-nameplate">
            <span>Golden Pony English</span>
            <strong>Cô Julia</strong>
            <small>IELTS tutor, GenZ vibe, lớp nhỏ thân thiện.</small>
          </div>
        </div>

        <div className="landing-about-copy">
          <div className="eyebrow">About Julia Preview</div>
          <h2>Người đồng hành ấm áp cho hành trình IELTS bớt áp lực.</h2>
          <p className="landing-about-intro">
            Julia kết hợp nền tảng sư phạm chắc, kinh nghiệm lớp nhỏ và cách feedback dễ hiểu để học viên tiến bộ từng bước.
          </p>

          <div className="landing-credential-grid">
            {JULIA_CREDENTIALS.map((item) => {
              const Icon = item.Icon;

              return (
                <article className="landing-credential-card" key={item.title}>
                  <span aria-hidden="true"><Icon size={19} strokeWidth={2.1} /></span>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              );
            })}
          </div>

          <div className="landing-experience-timeline">
            {JULIA_EXPERIENCE.map((item) => (
              <article className="landing-experience-item" key={item.title}>
                <span>{item.period}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


function FaqPreviewSection() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section className="landing-section landing-faq-section" id="faq">
      <div className="landing-container landing-faq-grid">
        <SectionHeader
          align="left"
          title="FAQ & Course Policy"
          description="Các quy định chính được tóm tắt ngắn gọn để phụ huynh và học viên dễ nắm."
        />
        <div className="landing-faq-list">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;

            return (
              <article className={isOpen ? 'card landing-faq-card open' : 'card landing-faq-card'} key={faq.question}>
                <button
                  aria-expanded={isOpen}
                  className="landing-faq-trigger"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  type="button"
                >
                  <span>{faq.question}</span>
                  <ChevronDown size={18} strokeWidth={2.2} />
                </button>
                {isOpen ? <p>{faq.answer}</p> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}


function CtaSection() {
  return (
    <section className="landing-section landing-cta-section" id="cta">
      <div className="landing-container card landing-cta-card">
        <div>
          <span>Golden Pony English</span>
          <h2>Sẵn sàng bắt đầu lộ trình IELTS?</h2>
          <p>Nhận tư vấn nhanh để chọn level phù hợp và lịch học dễ theo.</p>
        </div>
        <div className="actions landing-actions">
          <a className="btn primary" href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>Gọi tư vấn</a>
          <a className="btn" href={`mailto:${CONTACT.email}`}>Gửi email</a>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  const courseLinks = ['IELTS Tutor 1-1', 'Foundation', 'IELTS Basic', 'Level A-B-C'];
  const supportLinks = ['FAQ & Course Policy', 'Cam kết đầu ra', 'Bảo lưu khóa học', 'Chấm chữa bài'];

  return (
    <>
      <footer className="landing-footer" id="footer">
        <div className="landing-container landing-footer-grid">
          <div className="landing-footer-brand-col">
            <Link className="brand" href="/">
              <span className="logo image-logo"><img alt="Golden pony" className="brand-logo-img" src="/golden-pony.png" /></span>
              <span className="brand-name">Golden Pony English</span>
            </Link>
            <p>Học xịn - vibe chill - tiếng Anh lên skill cùng lớp nhỏ và lộ trình rõ ràng.</p>
          </div>

          <div className="landing-footer-col">
            <h3>Khóa học</h3>
            {courseLinks.map((item) => <a href="#courses" key={item}>{item}</a>)}
          </div>

          <div className="landing-footer-col">
            <h3>Hỗ trợ</h3>
            {supportLinks.map((item) => <a href="#faq" key={item}>{item}</a>)}
          </div>

          <div className="landing-footer-col landing-footer-contact">
            <h3>Liên hệ</h3>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <a href="https://goldenponyenglish.com">{CONTACT.website}</a>
            <span>{CONTACT.address}</span>
          </div>
        </div>
      </footer>

      <div className="landing-floating-contact" aria-label="Liên hệ nhanh">
        <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} aria-label="Gọi Golden Pony English">Phone</a>
        <a href="#" aria-label="Messenger placeholder">Messenger</a>
        <a href="#" aria-label="Zalo placeholder">Zalo</a>
      </div>
    </>
  );
}


export default function HomePage() {
  return (
    <main className="landing-page">
      <AppHeader />
      <HeroSection />
      <HighlightsSection />
      <RoadmapSection />
      <CourseCardsSection />
      <AboutJuliaSection />
      <FaqPreviewSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
