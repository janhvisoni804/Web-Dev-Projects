const inputType = document.getElementById('inputType');
const numberInput = document.getElementById('numberInput');
const binaryOutput = document.getElementById('binaryOutput');
const decimalOutput = document.getElementById('decimalOutput');
const octalOutput = document.getElementById('octalOutput');
const hexOutput = document.getElementById('hexOutput');
const feedback = document.getElementById('feedback');
const clearButton = document.getElementById('clearButton');

const radixMap = {
  binary: 2,
  decimal: 10,
  octal: 8,
  hexadecimal: 16
};

function normalizeInput(value) {
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

function validateValue(value, type) {
  const normalized = normalizeInput(value);
  if (!normalized) return false;

  const patterns = {
    binary: /^[01]+$/,
    decimal: /^[0-9]+$/,
    octal: /^[0-7]+$/,
    hexadecimal: /^[0-9a-f]+$/
  };

  return patterns[type].test(normalized);
}

function toNumber(value, type) {
  return parseInt(normalizeInput(value), radixMap[type]);
}

function formatValue(number, type) {
  if (Number.isNaN(number) || !Number.isFinite(number)) return '—';

  switch (type) {
    case 'binary': return number.toString(2);
    case 'decimal': return number.toString(10);
    case 'octal': return number.toString(8);
    case 'hexadecimal': return number.toString(16).toUpperCase();
    default: return '—';
  }
}

function updateOutputs() {
  const type = inputType.value;
  const value = numberInput.value;

  if (!validateValue(value, type)) {
    binaryOutput.textContent = '—';
    decimalOutput.textContent = '—';
    octalOutput.textContent = '—';
    hexOutput.textContent = '—';
    feedback.textContent = 'Enter a valid value for the selected input type.';
    return;
  }

  const parsedNumber = toNumber(value, type);
  if (Number.isNaN(parsedNumber)) {
    feedback.textContent = 'Unable to parse the input. Try a different value.';
    return;
  }

  binaryOutput.textContent = formatValue(parsedNumber, 'binary');
  decimalOutput.textContent = formatValue(parsedNumber, 'decimal');
  octalOutput.textContent = formatValue(parsedNumber, 'octal');
  hexOutput.textContent = formatValue(parsedNumber, 'hexadecimal');
  feedback.textContent = `Converted ${type} to all other number systems.`;
}

function clearFields() {
  numberInput.value = '';
  binaryOutput.textContent = '—';
  decimalOutput.textContent = '—';
  octalOutput.textContent = '—';
  hexOutput.textContent = '—';
  feedback.textContent = 'Type a valid value and choose the correct input format.';
  numberInput.focus();
}

inputType.addEventListener('change', () => {
  numberInput.value = '';
  updateOutputs();
});
numberInput.addEventListener('input', updateOutputs);
clearButton.addEventListener('click', clearFields);

clearFields();
