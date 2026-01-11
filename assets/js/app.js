gsap.registerPlugin(ScrollToPlugin);

/***********************
 * 1. fetch helpers
 ***********************/
async function fetchHTML(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("LOAD FAIL: " + url);
    return await res.text();
  } catch (err) {
    console.error(err);
  }
}

async function include(targetSelector, url) {
  const html = await fetchHTML(url);
  const el = document.querySelector(targetSelector);
  if (el && html) {
    el.innerHTML = html;
  }
}

/***********************
 * 2. 다크모드 기능
 ***********************/
function initDarkMode() {
  const darkBtn = document.querySelector("#dark_light");
  const body = document.body;
  if (!darkBtn) return;

  const statusText = darkBtn.querySelector("span");
  const icon = darkBtn.querySelector("i");

  // UI를 업데이트하는 핵심 로직
  const updateUI = (isDark) => {
    if (isDark) {
      body.classList.add("dark-mode");
      if (statusText) statusText.textContent = "light";
      if (icon) icon.classList.replace("fa-solid", "fa-regular");
    } else {
      body.classList.remove("dark-mode");
      if (statusText) statusText.textContent = "dark";
      if (icon) icon.classList.replace("fa-regular", "fa-solid");
    }
  };

  // [중요] 초기 실행: localStorage 무시하고 무조건 false(라이트모드)로 시작
  // 만약 테마 유지를 원하시면 이 부분을 다시 localStorage 확인으로 바꾸면 됩니다.
  updateUI(false); 

  // 클릭할 때만 토글
  darkBtn.onclick = () => {
    const isNowDark = !body.classList.contains("dark-mode");
    updateUI(isNowDark);
    // 선택사항: 클릭했을 때만 기억하게 하고 싶다면 유지, 아니면 아래 줄 삭제
    localStorage.setItem("theme", isNowDark ? "dark" : "light");
  };
}



/***********************
 * 3. 스크롤 제어 (GSAP)
 ***********************/
function initScrollNav() {
  const navLinks = document.querySelectorAll("nav ul li a");

  if (navLinks.length === 0) {
    console.error("네비게이션 링크를 찾을 수 없습니다. Header가 로드되기 전에 실행되었을 수 있습니다.");
    return;
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");

      gsap.to(window, {
        duration: 1,
        scrollTo: { y: targetId, offsetY: 20 },
        ease: "power2.inOut"
      });
    });
  });
}

/***********************
 * 4. Return Top
 ***********************/

// 클릭 이벤트: 부모 요소를 추적하는 closest() 사용
document.addEventListener('click', function (e) {
  // 클릭된 요소(e.target)에서 가장 가까운 #returnTop 요소를 찾음
  const btn = e.target.closest('#returnTop');
  
  if (btn) {
    console.log("버튼 클릭됨! (아이콘을 눌러도 인식됩니다)");
    e.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
});

// 스크롤 감지: 버튼 표시/숨김
window.addEventListener('scroll', function() {
  const topButton = document.getElementById("returnTop");
  if (topButton) {
    // 현재 스크롤 위치 계산 (브라우저 호환성 고려)
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // 100px 이상 스크롤 시 보이게 함
    if (scrollY > 100) {
      topButton.style.display = "block";
    } else {
      topButton.style.display = "none";
    }
  }
});


/***********************
 * 5. 앱 초기화 (전체 레이아웃 로드)
 ***********************/
async function initApp() {
  await include(".app-header", "./includes/header.html");
  await include(".app-main", "./includes/main.html");
  await include(".app-footer", "./includes/footer.html");

  initDarkMode();   // 다크모드 초기화
  initScrollNav();  // 스크롤 네비게이션 초기화 (헤더 로드 후 실행!)
}


document.addEventListener("DOMContentLoaded", initApp);