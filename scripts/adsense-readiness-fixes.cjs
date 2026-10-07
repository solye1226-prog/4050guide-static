const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const today = '2026-10-07';
const origin = 'https://4050guide.co.kr';
const escape = text => String(text)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const sourceMap = {
  '50대-남자-재취업-자격증-추천': [
    ['고용24 채용정보와 직업정보', 'https://www.work24.go.kr/'],
    ['Q-Net 국가자격 종목별 정보', 'https://www.q-net.or.kr/'],
  ],
  '50대-재취업-현실': [
    ['고용24 채용정보와 중장년 정책', 'https://www.work24.go.kr/'],
  ],
  '건축도장기능사-4050-실기-공부법': [
    ['Q-Net 국가자격 종목별 상세정보', 'https://www.q-net.or.kr/'],
  ],
  '경비원-신임교육-4050-준비법': [
    ['경찰청 일반경비원 신임교육 기관 및 일정 공지', 'https://www.police.go.kr/user/bbs/BD_selectBbsList.do?q_bbsCode=1001&q_searchKeyTy=sj___1002&q_searchVal=%EA%B2%BD%EB%B9%84'],
    ['고용24 경비원 채용정보 확인', 'https://www.work24.go.kr/'],
  ],
  '경비원-월급-현실': [
    ['고용24 경비원 채용공고와 임금조건', 'https://www.work24.go.kr/'],
    ['경찰청 일반경비원 신임교육 안내', 'https://www.police.go.kr/user/bbs/BD_selectBbsList.do?q_bbsCode=1001&q_searchKeyTy=sj___1002&q_searchVal=%EA%B2%BD%EB%B9%84'],
  ],
  '공조냉동기계기능사-4050-공부법': [
    ['Q-Net 국가자격 종목별 상세정보', 'https://www.q-net.or.kr/'],
  ],
  '국가기술자격-문제집-고르는-법': [
    ['Q-Net 국가기술자격 출제기준과 공개문제', 'https://www.q-net.or.kr/'],
    ['Q-Net 시험일정 확인', 'https://www.q-net.or.kr/crf021.do?id=crf02103'],
  ],
  '국비지원-자격증-조건': [
    ['고용24 국민내일배움카드 발급안내', 'https://www.work24.go.kr/hr/h/a/1100/selectIssuGudn.do'],
  ],
  '사회복지사-2급-4050-공부법': [
    ['한국사회복지사협회 자격관리센터', 'https://www.welfare.net/lic/main.do'],
    ['국가평생교육진흥원 학점은행제 사회복지사 안내', 'https://www.cb.or.kr/creditbank/impartion/impartion3_1_1.do'],
  ],
  '소방안전관리자-4050-공부법': [
    ['한국소방안전원 자격·강습교육 안내', 'https://www.kfsi.or.kr/'],
  ],
  '시험-30일-전-공부계획표': [
    ['Q-Net 시험일정 확인', 'https://www.q-net.or.kr/crf021.do?id=crf02103'],
    ['Q-Net 출제기준과 공개문제', 'https://www.q-net.or.kr/'],
  ],
  '요양보호사-자격증-공부법': [
    ['한국보건의료인국가시험원 요양보호사 시험안내', 'https://www.kuksiwon.or.kr/ss/index.do'],
  ],
  '자격증-독학-vs-국비지원-학원': [
    ['고용24 국민내일배움카드 발급안내', 'https://www.work24.go.kr/hr/h/a/1100/selectIssuGudn.do'],
    ['Q-Net 국가자격 종목별 정보', 'https://www.q-net.or.kr/'],
  ],
  '전기기능사-4050-공부법': [
    ['Q-Net 전기기능사 종목별 상세정보', 'https://www.q-net.or.kr/crf005.do?gbnn=gbnSubtab2&id=crf00503&jmCd=7780'],
  ],
  '지게차운전기능사-필기-공부법': [
    ['Q-Net 지게차운전기능사 종목별 정보', 'https://www.q-net.or.kr/'],
    ['고용24 국민내일배움카드 발급안내', 'https://www.work24.go.kr/hr/h/a/1100/selectIssuGudn.do'],
  ],
  '한식조리기능사-4050-공부법': [
    ['Q-Net 한식조리기능사 종목별 상세정보', 'https://www.q-net.or.kr/crf005.do?gId=&gSite=Q&id=crf00503&jmCd=7910'],
  ],
};

const faqMap = {
  '50대-남자-재취업-자격증-추천': [
    ['자격증부터 따고 일자리를 찾아야 하나요?', '희망 직종의 채용공고에서 실제 우대 자격과 근무조건을 먼저 확인한 뒤 필요한 자격만 준비하는 편이 안전합니다.'],
    ['야간이나 교대근무가 어렵다면 어떤 분야를 봐야 하나요?', '시설관리와 경비는 교대 비중이 높을 수 있으므로 주간 고정, 운전·배송, 현장지원 등 근무표가 맞는 공고를 따로 비교하세요.'],
    ['자격증이 있으면 취업이 보장되나요?', '자격증은 지원 조건이나 우대 요소일 뿐입니다. 경력, 근무 가능 시간, 건강 상태, 지역 채용 수요를 함께 봐야 합니다.'],
  ],
  '50대-재취업-현실': [
    ['자격증이 없으면 재취업이 어렵나요?', '직무에 따라 자격보다 기존 경력, 운전 가능 여부, 고객 응대, 교대근무 가능 여부를 더 중요하게 보는 공고도 많습니다.'],
    ['경력 공백은 어떻게 설명하면 좋나요?', '공백 자체를 숨기기보다 그 기간의 교육, 가족 돌봄, 단기 업무와 최근 준비 내용을 지원 직무에 맞춰 간단히 설명하세요.'],
    ['월급이 낮아도 일단 시작하는 것이 좋을까요?', '급여뿐 아니라 근무시간, 통근비, 식대, 보험, 계약기간과 다음 경력으로 이어질 가능성을 함께 계산한 뒤 결정해야 합니다.'],
  ],
  'Q-Net-월간시험일정-보는-법': [
    ['월간시험일정만 보면 접수일이 확정된 건가요?', '시행계획과 종목별 공고가 변경될 수 있으므로 실제 접수 전 원서접수 화면과 공지사항을 다시 확인하세요.'],
    ['상시검정과 정기검정은 무엇이 다른가요?', '종목별 시행 방식과 회차가 다릅니다. 같은 기능사라도 상시 시행 여부가 다를 수 있으므로 종목 상세정보에서 확인해야 합니다.'],
    ['시험장 선택은 언제 확인하나요?', '원서접수 기간과 지역별 개설 상황에 따라 달라질 수 있습니다. 접수 시작 전에 사진과 결제수단을 준비하고 접수 화면에서 확인하세요.'],
  ],
  '경비원-월급-현실': [
    ['월급이 높은 공고가 더 좋은 일자리인가요?', '월 총액만 보지 말고 근무일수, 휴게시간, 야간근로, 식대와 퇴직금 포함 여부를 함께 비교해야 합니다.'],
    ['감시·단속적 근로자는 급여 계산이 다른가요?', '승인 여부와 근로계약에 따라 적용 기준이 달라질 수 있으므로 채용공고만으로 단정하지 말고 계약서와 사업장 설명을 확인하세요.'],
    ['실수령액은 어떻게 비교하나요?', '세전 급여에서 보험료와 세금뿐 아니라 통근비, 식비, 추가 근무 가능성을 함께 적어 월 기준으로 비교하는 것이 좋습니다.'],
  ],
  '국비지원-자격증-조건': [
    ['국민내일배움카드가 있으면 모든 과정이 무료인가요?', '과정과 참여자 유형에 따라 자비부담액이 달라집니다. 수강신청 전 고용24 과정 상세의 실제 부담액을 확인하세요.'],
    ['자격시험 응시료도 카드로 지원되나요?', '훈련비 지원과 자격시험 응시료는 별개일 수 있습니다. 과정 포함 여부와 시험 시행기관의 결제 기준을 따로 확인해야 합니다.'],
    ['아무 학원에서나 사용할 수 있나요?', '고용24에 등록된 국민내일배움카드 훈련과정인지 확인해야 하며, 같은 자격 과정도 기관별 일정과 자비부담금이 다를 수 있습니다.'],
  ],
};

const scopeMap = {
  '경비원-신임교육-4050-준비방법': '교육 대상과 공식 일정, 일반경비원 취업 전 전체 준비 순서를 다룹니다.',
  '경비원-신임교육-4050-준비법': '교육을 신청한 뒤 준비할 서류와 수업 전 학습·생활 준비에 집중합니다.',
  '경비원-취업-전-확인할-것': '교육 이수 이후 채용공고와 근무 형태를 비교하는 단계에 집중합니다.',
  '4050-국민내일배움카드-자비부담금-확인법': '같은 과정인데도 자비부담금이 달라지는 이유와 비교 기준을 설명합니다.',
  '국민내일배움카드-자비부담금-확인방법': '고용24 과정 상세에서 실제 자비부담액을 조회하는 순서에 집중합니다.',
  '퇴직-후-건강보험료-줄이는-방법': '임의계속가입 신청기한과 피부양자·지역가입자 선택지를 함께 비교합니다.',
  '퇴직-후-건강보험료-줄이는-법': '지역가입자로 전환되기 전 준비할 서류와 확인 순서에 집중합니다.',
  '치매검사-지원-확인방법': '치매안심센터 이용 절차와 검사 상담을 시작하는 방법을 설명합니다.',
  '치매검사비-지원-확인방법': '검사 단계별 비용 지원 대상과 보건소 상담 전 준비에 집중합니다.',
  '기초연금-수급자격-확인방법': '나이와 소득인정액을 중심으로 신청 가능성을 처음 확인하는 글입니다.',
  '기초연금-신청-전-확인할-것': '신청 직전 소득·재산 자료와 탈락 가능 요인을 점검하는 글입니다.',
  '기초연금-탈락-이유': '신청 결과에서 자주 문제가 되는 소득인정액 항목과 재확인 순서를 다룹니다.',
  '중장년-내일센터-이용방법': '센터가 제공하는 서비스와 상담 신청 경로를 처음 알아보는 분을 위한 글입니다.',
  '중장년-내일센터-상담받기-전-준비할-것': '상담 예약 뒤 경력·희망조건·질문을 준비하는 단계에 집중합니다.',
  '소상공인-정책자금-신청-전-확인할-것': '정책자금이 대출인지 지원금인지 구분하고 신청 가능성을 확인하는 글입니다.',
  '소상공인-정책자금-4050-자영업자-확인방법': '신청을 결정한 자영업자가 준비할 서류와 확인 경로에 집중합니다.',
  '건축도장기능사-4050-준비방법': '자격 선택 전 시험 형태와 취업 활용도를 판단하는 글입니다.',
  '건축도장기능사-4050-실기-공부법': '응시를 결정한 뒤 실기 연습과 시간 배분을 준비하는 글입니다.',
};

function articleFile(slug) {
  return path.join(root, slug, 'index.html');
}

function displayDate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

function existingModified(html) {
  const schemaMatch = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(match => { try { return JSON.parse(match[1]); } catch { return {}; } })
    .find(item => item['@type'] === 'BlogPosting');
  if (schemaMatch?.dateModified) return schemaMatch.dateModified;
  const visible = html.match(/<dt>업데이트<\/dt>\s*<dd>(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일<\/dd>/);
  return visible ? `${visible[1]}-${visible[2].padStart(2, '0')}-${visible[3].padStart(2, '0')}` : today;
}

function addSources(slug, html, sources) {
  if (html.includes('class="editorial-sources"')) return html;
  const items = sources.map(([label, href]) => `<li><a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a></li>`).join('');
  const section = `<section class="editorial-sources"><h2>공식 자료와 확인일</h2><p>${displayDate(today)} 확인한 공식 자료입니다. 시험·교육·채용 조건은 바뀔 수 있으므로 실제 접수 전 해당 기관의 최신 안내를 다시 확인하세요.</p><ul>${items}</ul></section>`;
  if (html.includes('<div class="guide-related-posts">')) {
    html = html.replace('<div class="guide-related-posts">', `${section}\n<div class="guide-related-posts">`);
  } else if (html.includes('<section class="guide-related-posts">')) {
    html = html.replace('<section class="guide-related-posts">', `${section}\n<section class="guide-related-posts">`);
  } else if (/<h2[^>]*>함께 보면 좋은 글<\/h2>/.test(html)) {
    html = html.replace(/(<h2[^>]*>함께 보면 좋은 글<\/h2>)/, `${section}\n$1`);
  } else {
    throw new Error(`Related section not found: ${slug}`);
  }
  const asideStart = html.indexOf('<aside class="detail-side"');
  const asideEnd = html.indexOf('</aside>', asideStart);
  if (asideStart >= 0 && asideEnd > asideStart) {
    const aside = html.slice(asideStart, asideEnd + 8)
      .replace(/<dt>출처<\/dt>\s*<dd>[\s\S]*?<\/dd>/, `<dt>출처</dt><dd>${escape(sources[0][0])}</dd>`)
      .replace(/<a class="panel-button" href="[^"]*"[^>]*>[\s\S]*?<\/a>/, `<a class="panel-button" href="${escape(sources[0][1])}" target="_blank" rel="noopener noreferrer">공식 안내 확인</a>`);
    html = html.slice(0, asideStart) + aside + html.slice(asideEnd + 8);
  }
  return html;
}

function addFaq(slug, html, faqs) {
  if (/<h2[^>]*>\s*(자주 묻는 질문|FAQ)\s*<\/h2>/.test(html)) return html;
  const faq = `<h2>자주 묻는 질문</h2>${faqs.map(([q, a]) => `<h3>${escape(q)}</h3><p>${escape(a)}</p>`).join('')}`;
  if (html.includes('<section class="editorial-sources">')) return html.replace('<section class="editorial-sources">', `${faq}\n<section class="editorial-sources">`);
  if (html.includes('<div class="guide-related-posts">')) return html.replace('<div class="guide-related-posts">', `${faq}\n<div class="guide-related-posts">`);
  if (html.includes('<section class="guide-related-posts">')) return html.replace('<section class="guide-related-posts">', `${faq}\n<section class="guide-related-posts">`);
  if (/<h2[^>]*>함께 보면 좋은 글<\/h2>/.test(html)) return html.replace(/(<h2[^>]*>함께 보면 좋은 글<\/h2>)/, `${faq}\n$1`);
  throw new Error(`FAQ insertion point not found: ${slug}`);
}

function addScope(html, text) {
  if (html.includes('<strong>이 글의 범위</strong>')) return html;
  return html.replace('<div class="content detail-content">', `<div class="content detail-content"><p><strong>이 글의 범위</strong> ${escape(text)}</p>`);
}

function setBlogPosting(html, modified) {
  html = html.replaceAll('4050가이드 편집 ·', '4050가이드 편집부 ·');
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/i)?.[1];
  const headline = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, '').trim();
  const description = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || '';
  const image = html.match(/<meta\b[^>]*(?:property|name)="og:image"[^>]*content="([^"]+)"[^>]*>/i)?.[1];
  if (!canonical || !headline) throw new Error(`Missing schema fields: ${canonical || headline}`);
  let datePublished;
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>\s*/g, (all, json) => {
    try {
      const data = JSON.parse(json);
      if (data['@type'] !== 'BlogPosting') return all;
      datePublished = data.datePublished;
      return '';
    } catch { return all; }
  });
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: headline.replaceAll('&amp;', '&'),
    description: description.replaceAll('&amp;', '&'),
    dateModified: modified,
    ...(image ? { image } : {}),
    author: { '@type': 'Organization', name: '4050가이드 편집부', url: `${origin}/소개/` },
    publisher: { '@type': 'Organization', name: '4050가이드' },
    mainEntityOfPage: canonical,
    inLanguage: 'ko-KR',
    ...(datePublished ? { datePublished } : {}),
  };
  if (!html.includes('class="editorial-byline"')) {
    const byline = `<p class="editorial-byline">4050가이드 편집부 · 내용 확인 ${modified} · <a href="/정보-출처-및-면책-안내/">작성 기준</a></p>`;
    html = html.replace(/(<header class="detail-title">[\s\S]*?<h1[\s\S]*?<\/h1>\s*<p>[\s\S]*?<\/p>)/, `$1${byline}`);
  }
  return html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`);
}

function directRedirects() {
  const map = new Map();
  const lines = fs.readFileSync(path.join(root, '_redirects'), 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const [from, to, status] = line.trim().split(/\s+/);
    if (status === '301' && /^\/[^*?]+\/$/.test(from || '') && /^\/[^*?]+\/$/.test(to || '')) map.set(from, to);
  }
  return map;
}

function repairCanonicals() {
  let fixed = 0;
  const redirects = directRedirects();
  for (const [from, to] of redirects) {
    const slug = decodeURIComponent(from).replace(/^\//, '').replace(/\/$/, '');
    const file = articleFile(slug);
    if (!fs.existsSync(file)) continue;
    const old = fs.readFileSync(file, 'utf8');
    const target = origin + decodeURIComponent(to);
    const html = old.replace(/<link\b[^>]*rel="canonical"[^>]*>/i, `<link rel="canonical" href="${target}">`);
    if (html !== old) { fs.writeFileSync(file, html); fixed += 1; }
  }
  const categoryRoot = path.join(root, 'category');
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const item = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(item);
      if (!entry.isFile() || entry.name !== 'index.html') continue;
      const relative = path.relative(root, path.dirname(item)).replaceAll('\\', '/');
      const canonical = `${origin}/${relative}/`;
      const old = fs.readFileSync(item, 'utf8');
      const html = old.replace(/<link\b[^>]*rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`);
      if (html !== old) { fs.writeFileSync(item, html); fixed += 1; }
    }
  };
  walk(categoryRoot);
  return fixed;
}

function updateArticles() {
  const audit = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'content-audit.json'), 'utf8'));
  let changed = 0;
  for (const post of audit.posts) {
    const slug = post.file.split('/')[0];
    const file = articleFile(slug);
    const old = fs.readFileSync(file, 'utf8');
    let html = old;
    const materiallyUpdated = sourceMap[slug] || faqMap[slug] || scopeMap[slug];
    if (sourceMap[slug]) html = addSources(slug, html, sourceMap[slug]);
    if (faqMap[slug]) html = addFaq(slug, html, faqMap[slug]);
    if (scopeMap[slug]) html = addScope(html, scopeMap[slug]);
    const modified = materiallyUpdated ? today : existingModified(html);
    html = setBlogPosting(html, modified);
    if (materiallyUpdated) {
      html = html.replace(/<dt>업데이트<\/dt>\s*<dd>[\s\S]*?<\/dd>/, `<dt>업데이트</dt><dd>${displayDate(today)}</dd>`);
    }
    if (html !== old) { fs.writeFileSync(file, html); changed += 1; }
  }
  return changed;
}

function updatePrivacy() {
  const files = [articleFile('개인정보처리방침'), articleFile('privacy-policy')];
  let changed = 0;
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const old = fs.readFileSync(file, 'utf8');
    let html = old.replace(
      '4050가이드는 향후 Google AdSense를 포함한 제3자 광고 서비스를 사용할 수 있습니다.',
      '4050가이드는 Google AdSense 승인 절차를 진행하고 있으며, 승인 후 Google AdSense를 포함한 제3자 광고 서비스를 사용할 수 있습니다.'
    );
    html = html.replace(
      'Google의 광고 쿠키 사용을 원하지 않는 경우 Google 광고 설정 페이지에서 맞춤 광고를 비활성화할 수 있습니다. 또한 이용자는 브라우저 설정에서 쿠키 사용을 제한할 수 있습니다.',
      'Google의 광고 쿠키 사용을 원하지 않는 경우 <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google 광고 설정</a>에서 맞춤 광고를 비활성화할 수 있습니다. 추가 제3자 광고 사업자를 사용하는 경우 해당 사업자와 선택 해제 방법을 이 방침에 안내합니다. 또한 이용자는 브라우저 설정에서 쿠키 사용을 제한할 수 있습니다.'
    );
    if (!html.includes('Google 인증 동의 관리 플랫폼')) {
      html = html.replace(
        '<h2>6. 접속 기록 및 통계</h2>',
        '<p>유럽경제지역, 영국 또는 스위스 이용자에게 광고를 제공하는 경우 Google 인증 동의 관리 플랫폼을 통해 필요한 선택권과 동의 화면을 제공합니다.</p>\n<h2>6. 접속 기록 및 통계</h2>'
      );
    }
    html = html.replace(/<p>시행일: [^<]+<\/p>/, `<p>시행일: 2026년 5월 18일 · 최종 변경일: ${displayDate(today)}</p>`);
    html = html.replace(/<p>최근 수정일: [^<]+<\/p>/, `<p>최근 수정일: ${displayDate(today)}</p>`);
    if (html !== old) { fs.writeFileSync(file, html); changed += 1; }
  }
  return changed;
}

function cleanInternalIndexLinks() {
  let filesChanged = 0;
  let linksChanged = 0;
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'scripts') continue;
      const item = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(item);
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
      const old = fs.readFileSync(item, 'utf8');
      const relative = path.relative(root, item).replaceAll('\\', '/');
      const base = new URL(relative, `${origin}/`);
      const html = old.replace(/href=(["'])([^"']*index\.html(?:[?#][^"']*)?)\1/gi, (all, quote, href) => {
        let url;
        try { url = new URL(href, base); } catch { return all; }
        if (!['4050guide.co.kr', 'www.4050guide.co.kr'].includes(url.hostname) || !url.pathname.endsWith('/index.html')) return all;
        linksChanged += 1;
        const clean = url.pathname.slice(0, -'index.html'.length) + url.search + url.hash;
        return `href=${quote}${clean}${quote}`;
      });
      if (html !== old) { fs.writeFileSync(item, html); filesChanged += 1; }
    }
  };
  walk(root);
  return { filesChanged, linksChanged };
}

function rebuildSitemap() {
  const oldXml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const oldDates = new Map([...oldXml.matchAll(/<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<lastmod>(.*?)<\/lastmod>[\s\S]*?<\/url>/g)].map(match => [match[1], match[2]]));
  const updated = new Set([...Object.keys(sourceMap), ...Object.keys(faqMap), ...Object.keys(scopeMap), '개인정보처리방침']);
  const records = new Map();
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'scripts') continue;
      const item = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(item);
      if (!entry.isFile() || entry.name !== 'index.html') continue;
      const html = fs.readFileSync(item, 'utf8');
      const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/i)?.[1];
      if (!canonical?.startsWith(`${origin}/`)) continue;
      const relativeDir = path.relative(root, path.dirname(item)).replaceAll('\\', '/');
      const localPath = relativeDir ? `/${relativeDir}/` : '/';
      let canonicalPath;
      try { canonicalPath = decodeURI(new URL(canonical).pathname); } catch { continue; }
      if (canonicalPath !== localPath) continue;
      const slug = relativeDir.split('/')[0];
      const lastmod = updated.has(slug) ? today : (oldDates.get(canonical) || existingModified(html));
      records.set(canonical, lastmod);
    }
  };
  walk(root);
  const entries = [...records.entries()].sort(([a], [b]) => a.localeCompare(b, 'ko'));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(([url, date]) => `  <url><loc>${url}</loc><lastmod>${date}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
  return entries.length;
}

const canonicalFixes = repairCanonicals();
const articlesChanged = updateArticles();
const privacyChanged = updatePrivacy();
const indexLinksCleaned = cleanInternalIndexLinks();
const sitemapUrls = rebuildSitemap();
console.log(JSON.stringify({ canonicalFixes, articlesChanged, privacyChanged, indexLinksCleaned, sitemapUrls }, null, 2));
