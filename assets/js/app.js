
/*
  include header/footer
*/
async function loadInto(selector, url) {
  const el = document.querySelector(selector);
  if (!el) {
    console.error("Target not found:", selector);
    return;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const html = await res.text();
    el.innerHTML = html;
  } catch (e) {
    console.error("Include failed:", url, e);
    el.innerHTML = "<!-- include failed: " + url + " -->";
  }
}

async function includeLayout() {
  await loadInto("#app-header", "./partials/header.html");
  await loadInto("#app-footer", "./partials/footer.html");

  document.dispatchEvent(new CustomEvent("partials:loaded"));
}

document.addEventListener("DOMContentLoaded", includeLayout);




/*
  scrollTrigger
*/

gsap.registerPlugin(ScrollTrigger);

var panels = gsap.utils.toArray(".section");
panels.pop();

panels.forEach((panel, i) => {
  
  // Get the element holding the content inside the panel
  let innerpanel = panel.querySelector(".section-inner");
  
  // Get the Height of the content inside the panel
  let panelHeight = innerpanel.offsetHeight;
  console.log(panelHeight)
  
  // Get the window height
  let windowHeight = window.innerHeight;
  
  let difference = panelHeight - windowHeight;
  
  // ratio (between 0 and 1) representing the portion of the overall animation that's for the fake-scrolling. We know that the scale & fade should happen over the course of 1 windowHeight, so we can figure out the ratio based on how far we must fake-scroll
  let fakeScrollRatio = difference > 0 ? (difference / (difference + windowHeight)) : 0;
  
  // if we need to fake scroll (because the panel is taller than the window), add the appropriate amount of margin to the bottom so that the next element comes in at the proper time.
  if (fakeScrollRatio) {
    panel.style.marginBottom = panelHeight * fakeScrollRatio + "px";
  }
  
  let tl = gsap.timeline({
    scrollTrigger:{
      trigger: panel,
      start: "bottom bottom",
      end: () => fakeScrollRatio ? `+=${innerpanel.offsetHeight}` : "bottom top",
      pinSpacing: false,
      markers: true,
      pin: true,
      scrub: true
    }
  });
  
  // fake scroll. We use 1 because that's what the rest of the timeline consists of (0.9 scale + 0.1 fade)
  if (fakeScrollRatio) {
    tl.to(innerpanel, {yPercent:-100, y: window.innerHeight, duration: 1 / (1 - fakeScrollRatio) - 1, ease: "none"});
  }
  tl.fromTo(panel, {scale:1, opacity:1}, {scale: 0.7, opacity: 0.5, duration: 0.9})
    .to(panel, {opacity:0, duration: 0.1});
});




/*
  nav action toggle
*/
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

(function () {
  var headerRoot = document.getElementById("app-header");
  if (!headerRoot) return;

  var toggleBtn = headerRoot.querySelector(".nav-toggle");
  if (!toggleBtn) return;

  var panel = document.getElementById("nav-panel");
  var scroller = document.scrollingElement || document.documentElement;

  function openMenu() {
    panel.hidden = false;
    toggleBtn.setAttribute("aria-expanded", "true");
    header.classList.add("is-open");
  }

  function closeMenu() {
    header.classList.remove("is-open");
    toggleBtn.setAttribute("aria-expanded", "false");
    panel.hidden = true;
  }

  toggleBtn.addEventListener("click", function () {
    var expanded = toggleBtn.getAttribute("aria-expanded") === "true";
    if (expanded) closeMenu();
    else openMenu();
  });

  // 메뉴 내부 클릭 처리 (내부 섹션만 ScrollTo)
  panel.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-scroll]");
    if (!btn) return;

    var targetId = btn.getAttribute("data-scroll"); // section2, section3...
    var targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    var offsetY = header ? header.offsetHeight : 0;

    // 메뉴 닫고 이동
    closeMenu();

    gsap.to(scroller, {
      duration: 1,
      ease: "power2.out",
      scrollTo: { y: targetEl, offsetY: offsetY, autoKill: false },
      onComplete: function () {
        // pin/trigger 계산 보정
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
    });
  });

  // ESC로 닫기
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  // 바깥 클릭으로 닫기(옵션)
  document.addEventListener("click", function (e) {
    if (!header.classList.contains("is-open")) return;
    if (e.target.closest("#site-header")) return;
    closeMenu();
  });
})();





/* splitText */
// gsap.registerPlugin(SplitText);

// var split, animation, delayCall;


// function runLinesAnimation() {
//   // 기존 애니메이션 되돌리고 다시 실행
//   animation && animation.revert();

//   // split이 아직 없으면 종료
//   if (!split || !split.lines) return;

//   animation = gsap.from(split.lines, {
//     rotationX: -100,
//     transformOrigin: "50% 50% -100px",
//     opacity: 0,
//     duration: 1.5,
//     ease: "power3.out",
//     stagger: 0.25
//   });
// }

// function setup() {
//   // 기존 split/애니메이션 정리
//   split && split.revert();
//   animation && animation.revert();

//   // ✅ lines 포함해서 split 생성
//   split = SplitText.create(".text", { type: "chars,words,lines" });

//   // ✅ 로딩 후 3초 딜레이 재생
//   delayCall = gsap.delayedCall(3, runLinesAnimation);
  
// }

// // ✅ 폰트 로딩까지 기다렸다가 실행 (줄 분해 안정성)
// document.fonts.ready.then(function () {
//   setup();
// });

// // ✅ 리사이즈 시 재계산 + 애니메이션 재실행
// window.addEventListener("resize", function () {
//   setup();
// });


gsap.registerPlugin(SplitText);

console.clear();

var items = [];     // { el, split, anim, delay }
var DELAY_SEC = 1;

function killAll() {
  items.forEach(function (it) {
    try { it.delay && it.delay.kill(); } catch (e) {}
    try { it.anim && it.anim.revert(); } catch (e2) {}
    try { it.split && it.split.revert(); } catch (e3) {}
  });
  items = [];
}

function setupAndPlayWithDelay() {
  console.log("[setup] start");

  // 0) 기존 정리
  killAll();

  // 1) 대상 체크
  var targets = document.querySelectorAll(".text");
  console.log("[setup] .text count =", targets.length);

  if (!targets.length) {
    console.warn("[setup] .text가 DOM에 없음 (동적 삽입이면 삽입 직후 setup 호출 필요)");
    return;
  }

  if (typeof SplitText === "undefined") {
    console.error("[setup] SplitText 로드 안 됨(유료 플러그인/파일 누락 가능)");
    return;
  }

  targets.forEach(function (el, idx) {
    // ✅ 애니메이션 시작 전까지 절대 노출 금지
    gsap.set(el, { opacity: 0 });
    console.log("[target]", idx, "hidden (opacity:0)", el);

    // 2) SplitText 생성
    var split = SplitText.create(el, { type: "chars,words,lines" });
    console.log("[split]", idx, "lines =", split.lines ? split.lines.length : 0);

    var it = { el: el, split: split, anim: null, delay: null };
    items.push(it);

    // 3) 3초 후 애니메이션 시작
    it.delay = gsap.delayedCall(DELAY_SEC, function () {
      console.log("[delay done]", idx, "-> play");

      // 애니메이션 시작 직전에만 보여줌
      // (단, lines는 from에서 opacity:0이므로 갑자기 텍스트가 '보이는' 플래시는 없음)
      gsap.set(el, { opacity: 1 });

      var tl = gsap.timeline({
        onStart: function () {
          console.log("[anim start]", idx);
        },
        onComplete: function () {
          gsap.set(el, { opacity: 1 });
          console.log("[anim complete]", idx);
        }
      });

      split.lines.forEach(function (line, i) {
        tl.from(line, {
          rotationX: -60,
          transformOrigin: "50% 50% -60px",
          opacity: 0,
          duration: 1.0,
          ease: "power3.out"
        }, ">"); // 이전 라인 끝나고 다음 시작
      });

      it.anim = tl;

    });
  });

  console.log("[setup] scheduled", items.length, "items");
}

// 폰트 로딩 끝나면 실행 (라인 분해 안정)
document.fonts.ready.then(function () {
  console.log("[fonts] ready");
  setupAndPlayWithDelay();
});

// 리사이즈 시: 다시 숨김 -> 다시 split -> 다시 3초 후 재생
window.addEventListener("resize", function () {
  console.log("[resize] re-setup");
  setupAndPlayWithDelay();
});
