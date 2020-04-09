// Elements that are normally not clickable
const clickableElements = ['DIV', 'MATERIAL-ICON'];

export default class AccessibilityUtil {
  static init() {
    document.addEventListener('keyup', e => {
      // Div's don't handle tab navigation all that well, so let's handle clicking for them.
      if (e.key === 'Enter' && clickableElements.includes(e.target.nodeName)) {
        document.activeElement.click();
      }
    });
  }
}
