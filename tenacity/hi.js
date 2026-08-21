// Security – disable right-click and devtools shortcuts (same as shorturl.html)
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if (e.key === 'F12') e.preventDefault();
  if (e.ctrlKey && e.shiftKey && ['I', 'i', 'C', 'c', 'J', 'j'].includes(e.key)) e.preventDefault();
  if (e.ctrlKey && ['U', 'u'].includes(e.key)) e.preventDefault();
});
document.addEventListener('dragstart', e => e.preventDefault());
