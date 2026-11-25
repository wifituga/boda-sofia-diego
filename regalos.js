/* ===== Datos bancarios (se configuran en config.js) ===== */
const transfer = CONFIG.transferencia;
if ([transfer?.banco, transfer?.titular, transfer?.cuenta].every(value => typeof value === 'string' && value.trim())) {
  const panel = document.getElementById('giftTransfer');
  const status = document.getElementById('bankStatus');
  document.getElementById('bankName').textContent = transfer.banco.trim();
  document.getElementById('bankHolder').textContent = transfer.titular.trim();
  document.getElementById('acc').textContent = transfer.cuenta.trim();
  if (typeof transfer.cci === 'string' && transfer.cci.trim()) {
    document.getElementById('cci').textContent = transfer.cci.trim();
    document.getElementById('cciRow').hidden = false;
  }
  panel.hidden = false;
  for (const button of panel.querySelectorAll('[data-copy]')) {
    button.addEventListener('click', async () => {
      const number = document.getElementById(button.dataset.copy).textContent;
      try {
        await navigator.clipboard.writeText(number);
        status.textContent = button.dataset.copy === 'cci' ? 'CCI copiado.' : 'Número de cuenta copiado.';
      } catch {
        status.textContent = 'Selecciona el número para copiarlo manualmente.';
      }
    });
  }
}
