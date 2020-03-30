export default class ScrollService {
  static scrollToTop() {
    (function scrollSmoothly() {
      const { scrollTop } = document.body;
      if (scrollTop > 0) {
        document.body.scroll(0, scrollTop - 10);
        setTimeout(scrollSmoothly, 5);
      }
    })();
  }
}
