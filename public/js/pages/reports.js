// Reports Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('reportForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('reportType').value;
    const format = document.querySelector('input[name="format"]:checked').value;
    alert(`Generating ${type} report in ${format.toUpperCase()} format...`);
  });
  
  document.getElementById('previewBtn').addEventListener('click', () => {
    alert('Opening report preview...');
  });
  
  document.getElementById('addScheduleBtn').addEventListener('click', () => {
    alert('Schedule report dialog would open here.');
  });
});

function selectTemplate(type) {
  document.querySelectorAll('.report-template').forEach(t => t.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  document.getElementById('reportType').value = type;
}

