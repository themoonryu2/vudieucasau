import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@2.4.0/dist/purify.es.js';

// Danh sách truyện linh hoạt, thêm/sửa bao nhiêu cũng được
const stories = [
  {
    id: "Bi-Thu-Trung-Sinh",
    title: "Bí Thư Trùng Sinh",
    cover: "https://i.postimg.cc/DwvxJNy6/bi-thu-trung-sinh.jpg",
    baseUrl: "https://sstruyen.vn/bi-thu-trung-sinh"
  },
  {
    id: "Trung-Sinh-Chi-Nha-Noi",
    title: "Trùng Sinh Chi Nha Nội",
    cover: "https://i.postimg.cc/yxNNSBtB/trung-sinh-chi-nha-noi.jpg",
    baseUrl: "https://sstruyen.vn/trung-sinh-chi-nha-noi"
  },
  {
    id: "Quan-Lo-Thuong-Do",
    title: "Quan Lộ Thương Đồ",
    cover: "https://i.postimg.cc/vZXbfC7Z/quan-lo-thuong-do.jpg",
    baseUrl: "https://sstruyen.vn/quan-lo-thuong-do"
  },
  {
    id: "Quan-Than",
    title: "Quan Thần",
    cover: "https://i.postimg.cc/FzhTyCVh/quan-than.jpg",
    baseUrl: "https://sstruyen.vn/quan-than"
  }
];

const proxy = url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

const storySelect   = document.getElementById('story-select');
const storyCover    = document.getElementById('story-cover');
const chapterSelect = document.getElementById('chapter-select');
const chapterTitle  = document.getElementById('chapter-title');
const storyContent  = document.getElementById('story-content');

// Khởi tạo dropdown truyện
storySelect.innerHTML = stories.map(s => `<option value="${s.id}">${s.title}</option>`).join('');
storySelect.addEventListener('change', onStoryChange);
onStoryChange();  // load truyện đầu tiên

async function onStoryChange() {
  const sid = storySelect.value;
  const s = stories.find(x => x.id === sid);
  storyCover.src = s.cover;
  chapterTitle.textContent = 'Đang tải mục lục…';
  storyContent.innerHTML = '';
  chapterSelect.innerHTML = '';

  try {
    const res = await fetch(proxy(s.baseUrl), { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // selector mục lục trên sstruyen.vn
    const links = [...doc.querySelectorAll('.list-chapter li a, .chapter-list a')];
    if (!links.length) throw new Error('Không tìm thấy chương');

    const chapters = links.map(a => ({
      slug: new URL(a.href, s.baseUrl).pathname.split('/').filter(Boolean).pop(),
      title: a.textContent.trim()
    }));

    chapterSelect.innerHTML = chapters.map(ch =>
      `<option value="${ch.slug}">${ch.title}</option>`
    ).join('');
    chapterSelect.addEventListener('change', () => loadChapter(s, chapterSelect.value));

    // load chương đầu
    chapterSelect.value = chapters[0].slug;
    await loadChapter(s, chapters[0].slug);

  } catch (err) {
    console.error(err);
    chapterTitle.textContent = 'Lỗi lấy mục lục';
    chapterSelect.innerHTML = `<option disabled>${err.message}</option>`;
  }
}

async function loadChapter(story, slug) {
  chapterTitle.textContent = 'Đang tải chương…';
  storyContent.innerHTML = '';

  try {
    const url = `${story.baseUrl}/${slug}/`;
    const res = await fetch(proxy(url), { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const t = doc.querySelector('h1.title-chapter, .chapter-title')?.textContent.trim() || slug;
    const c = doc.querySelector('#chapter-content, .chapter-content')?.innerHTML || '<p>Không có nội dung</p>';

    chapterTitle.textContent = DOMPurify.sanitize(t);
    storyContent.innerHTML = DOMPurify.sanitize(c);

  } catch (err) {
    console.error(err);
    chapterTitle.textContent = 'Lỗi tải chương';
    storyContent.textContent = err.message;
  }
}
