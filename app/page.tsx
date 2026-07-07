import Link from 'next/link';
import { AppHeader } from './components/AppHeader';

type Highlight = {
  value: string;
  label: string;
  description: string;
};

type RoadmapStep = {
  level: string;
  band: string;
  headline: string;
  focus: string;
};

type Course = {
  title: string;
  band: string;
  duration: string;
  price: string;
  description: string;
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
    value: '5-8',
    label: 'học viên mỗi lớp',
    description: 'Lớp online nhóm nhỏ để giáo viên theo sát tiến độ, bài tập và phản hồi của từng bạn.',
  },
  {
    value: '0-7.0+',
    label: 'band mục tiêu',
    description: 'Lộ trình từ mất gốc, xây nền, làm quen IELTS tới luyện đề chuyên sâu.',
  },
  {
    value: '1-1',
    label: 'tutor cá nhân',
    description: 'Có gói kèm riêng cho học viên cần sửa bài kỹ, tăng tốc hoặc cá nhân hóa chiến thuật.',
  },
];

const ROADMAP: RoadmapStep[] = [
  {
    level: 'Foundation 1',
    band: '0 - 2.0',
    headline: 'Xây nền từ con số 0',
    focus: 'Ngữ pháp cốt lõi, IPA, phát âm nền tảng và từ vựng đời sống.',
  },
  {
    level: 'Foundation 2',
    band: '2.0 - 3.0',
    headline: 'Xây nền vững',
    focus: 'Ngữ pháp trung cấp, câu ghép, câu phức và phản xạ nói ngắn tự nhiên.',
  },
  {
    level: 'IELTS Basic',
    band: '3.0 - 4.0',
    headline: 'Làm quen IELTS từ A đến Z',
    focus: 'Chiến thuật Listening, Reading, paraphrase, brainstorming và Speaking fluency.',
  },
  {
    level: 'Level A',
    band: '4.0 - 5.0',
    headline: 'IELTS sơ cấp',
    focus: 'Ổn định Reading, Listening, xử lý 7 dạng Writing và luyện nói theo nhóm nhỏ.',
  },
  {
    level: 'Level B',
    band: '5.0 - 6.0+',
    headline: 'Trung cấp lên tay',
    focus: 'Writing và Speaking chuyên sâu, luyện sửa bài trực tiếp theo tiêu chí chấm IELTS.',
  },
  {
    level: 'Level C',
    band: '6.0 - 7.0+',
    headline: 'Cao cấp target 6.5 - 7.0+',
    focus: 'Luyện đề forecast, mock test, phát triển ý và sửa 20 bài viết chi tiết.',
  },
];

const COURSES: Course[] = [
  {
    title: 'Foundation 1',
    band: '0 - 2.0',
    duration: '20 buổi',
    price: '1.500.000 vnd',
    description: 'Học tiếng Anh từ con số 0 với ngữ pháp, từ vựng và phát âm nền tảng.',
  },
  {
    title: 'Foundation 2',
    band: '2.0 - 3.0',
    duration: '25 buổi',
    price: '2.500.000 vnd',
    description: 'Củng cố câu phức, liên kết ý, từ vựng gần gũi và phát âm tự nhiên hơn.',
  },
  {
    title: 'IELTS Basic',
    band: '3.0 - 4.0',
    duration: '30 buổi',
    price: '3.500.000 vnd',
    description: 'Nắm format bài thi, luyện kỹ năng đọc nghe và xây nền Writing, Speaking.',
  },
  {
    title: 'Level A',
    band: '4.0 - 5.0',
    duration: '32 buổi',
    price: '3.900.000 vnd',
    description: 'Tối ưu chiến thuật làm bài, tự học hiệu quả và được chấm chữa bài về nhà.',
  },
  {
    title: 'Level B',
    band: '5.0 - 6.0+',
    duration: '35 buổi',
    price: '6.000.000 vnd',
    description: 'Nâng band Writing, Speaking bằng luyện đề, sửa bài và phản hồi trực tiếp.',
  },
  {
    title: 'Level C',
    band: '6.0 - 7.0+',
    duration: '40 buổi',
    price: '14.000.000 vnd',
    description: 'Luyện đề chuyên sâu, mock test, kho ý tưởng Writing và forecast Speaking.',
  },
  {
    title: 'IELTS Tutor 1-1 cơ bản',
    band: '0 - 5.0',
    duration: 'Toàn khóa',
    price: '11.500.000 vnd',
    description: 'Kèm riêng nội dung Foundation, IELTS Basic, Level A và chấm chữa chuyên sâu.',
  },
  {
    title: 'IELTS Tutor 1-1 chuyên sâu',
    band: '5.0 - 6.5+',
    duration: 'Toàn khóa',
    price: '7.500.000 vnd',
    description: 'Luyện thi cá nhân hóa với giáo viên, tập trung chiến thuật và sửa lỗi band điểm.',
  },
];

const JULIA_PROFILE = [
  'Đang theo học Thạc sỹ chuyên ngành Lý luận và Phương pháp giảng dạy tiếng Anh tại Đại học Ngoại Ngữ, ĐHQGHN.',
  'Cử nhân Sư phạm Tiếng Anh tại ULIS, đạt chuẩn đầu ra C1, bậc 5 khung năng lực 6 bậc.',
  'Hơn 4 năm kinh nghiệm dạy 1-1, nhóm nhỏ, ôn thi chuyển cấp và chứng chỉ Cambridge, IELTS.',
];

const FAQS: Faq[] = [
  {
    question: 'Lớp IELTS online có bao nhiêu học viên?',
    answer: 'Các lớp nhóm nhỏ có sĩ số từ 5 đến 8 học viên để giáo viên theo sát bài tập và tiến độ.',
  },
  {
    question: 'Golden Pony có cam kết đầu ra không?',
    answer: 'Giáo viên cam kết dạy lại khi học viên không đạt đầu ra nếu học viên đáp ứng đủ điều kiện học tập trong quy định khóa học.',
  },
  {
    question: 'Có thể bảo lưu khóa học không?',
    answer: 'Học viên có lý do cá nhân được phép bảo lưu tối đa 1 tháng để đảm bảo tiến độ học.',
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
      <div className="landing-container landing-hero-grid">
        <div className="landing-hero-copy">
          <div className="eyebrow">Golden Pony English</div>
          <h1>Học xịn, vibe chill, IELTS lên skill</h1>
          <p>
            Lộ trình tiếng Anh và IELTS nhóm nhỏ cùng cô Julia, dành cho học viên cần nền chắc,
            mục tiêu rõ và phản hồi bài học sát từng giai đoạn.
          </p>
          <div className="actions landing-actions">
            <a className="btn primary" href={`mailto:${CONTACT.email}`}>Nhận tư vấn</a>
            <a className="btn" href="#courses">Xem khóa học</a>
          </div>
        </div>

        <div className="card landing-hero-card">
          <div className="landing-hero-card-copy">
            <span>IELTS Roadmap</span>
            <strong>0 tới 7.0+</strong>
            <small>Foundation, Basic, Level A, B, C và Tutor 1-1</small>
          </div>
          <img alt="Golden Pony mascot" className="landing-mascot" src="/golden-pony.png" />
        </div>
      </div>
    </section>
  );
}

function HighlightsSection() {
  return (
    <section className="landing-section" id="highlights">
      <div className="landing-container landing-highlight-grid">
        {HIGHLIGHTS.map((item) => (
          <article className="card landing-highlight-card" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RoadmapSection() {
  return (
    <section className="landing-section" id="roadmap">
      <div className="landing-container">
        <SectionHeader
          title="IELTS Roadmap"
          description="Mỗi chặng học có đầu vào, đầu ra và trọng tâm kỹ năng riêng để học viên biết mình đang đi đâu."
        />
        <div className="landing-roadmap">
          {ROADMAP.map((step) => (
            <article className="landing-roadmap-item" key={step.level}>
              <div>
                <span>{step.band}</span>
                <h3>{step.level}</h3>
              </div>
              <strong>{step.headline}</strong>
              <p>{step.focus}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CourseCardsSection() {
  return (
    <section className="landing-section" id="courses">
      <div className="landing-container">
        <SectionHeader
          align="compact"
          title="Course Cards"
          description="Dữ liệu tĩnh từ booklet Golden Pony English, chỉ phục vụ bố cục public landing page."
        />
        <div className="landing-course-grid">
          {COURSES.map((course) => (
            <article className="card landing-course-card" key={course.title}>
              <div className="landing-course-topline">
                <span>{course.band}</span>
                <small>{course.duration}</small>
              </div>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <div className="landing-course-price">{course.price}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutJuliaSection() {
  return (
    <section className="landing-section" id="about-julia">
      <div className="landing-container landing-about-grid">
        <div className="landing-about-portrait card">
          <img alt="Golden Pony mascot đại diện lớp học của Julia" src="/golden-pony.png" />
        </div>
        <div className="landing-about-copy">
          <div className="eyebrow">About Julia Preview</div>
          <h2>Cô giáo GenZ dẫn dắt lớp học chắc nền, dễ theo và nhiều phản hồi.</h2>
          <div className="landing-profile-list">
            {JULIA_PROFILE.map((item) => <p key={item}>{item}</p>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqPreviewSection() {
  return (
    <section className="landing-section" id="faq">
      <div className="landing-container landing-faq-grid">
        <SectionHeader
          align="left"
          title="FAQ Preview"
          description="Một vài thông tin quan trọng trước khi học viên chọn lớp và liên hệ tư vấn."
        />
        <div className="landing-faq-list">
          {FAQS.map((faq) => (
            <article className="card landing-faq-card" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
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
          <h2>Sẵn sàng chọn lộ trình IELTS phù hợp?</h2>
          <p>Landing page này chỉ dùng mock data frontend, chưa kết nối database và không thay đổi luồng đăng nhập.</p>
        </div>
        <div className="actions landing-actions">
          <a className="btn primary" href={`mailto:${CONTACT.email}`}>Liên hệ Julia</a>
          <a className="btn" href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="landing-footer" id="footer">
      <div className="landing-container landing-footer-grid">
        <Link className="brand" href="/">
          <span className="logo image-logo"><img alt="Golden pony" className="brand-logo-img" src="/golden-pony.png" /></span>
          <span className="brand-name">Golden pony</span>
        </Link>
        <div className="landing-footer-info">
          <span>{CONTACT.phone}</span>
          <span>{CONTACT.address}</span>
          <span>{CONTACT.email}</span>
          <span>{CONTACT.website}</span>
        </div>
      </div>
    </footer>
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
