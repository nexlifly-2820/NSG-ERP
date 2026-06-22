export function notify(msg, type = 'success') {
  if (window.toast) {
    if (type === 'error') window.toast.error(msg);
    else if (type === 'warning') window.toast.warning(msg);
    else if (type === 'info') window.toast.info(msg);
    else window.toast.success(msg);
  } else {
    window.toast.info(msg);
  }
}
