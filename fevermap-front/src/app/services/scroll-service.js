export default class ScrollService {
    static scrollToTop() {
        (function scrollSmoothly() {
            let scrollTop = document.body.scrollTop;
            if (scrollTop > 0) {
                document.body.scroll(0, scrollTop - 10);
                setTimeout(scrollSmoothly, 5);
            }
        })();
    }
}
