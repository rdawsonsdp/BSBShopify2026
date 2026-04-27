/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
class RecipientForm extends HTMLElement {
  constructor() {
    super();
    this.checkboxInput = this.querySelector(`#Recipient-Checkbox-${this.dataset.sectionId}`);
    this.checkboxInput.disabled = false;
    this.hiddenControlField = this.querySelector(`#Recipient-Control-${this.dataset.sectionId}`);
    this.hiddenControlField.disabled = true;
    this.emailInput = this.querySelector(`#Recipient-email-${this.dataset.sectionId}`);
    this.nameInput = this.querySelector(`#Recipient-name-${this.dataset.sectionId}`);
    this.messageInput = this.querySelector(`#Recipient-message-${this.dataset.sectionId}`);
  }

  connectedCallback() {
    this.addEventListener('change', this.onChange.bind(this));
    document.addEventListener('cart:added', this.resetRecipientForm.bind(this));
  }

  onChange() {
    if (!this.checkboxInput.checked) {
      this.clearInputFields();
    }
  }

  clearInputFields() {
    this.emailInput.value = '';
    this.nameInput.value = '';
    this.messageInput.value = '';
  }

  resetRecipientForm() {
    if (this.checkboxInput.checked) {
      this.checkboxInput.checked = false;
      this.clearInputFields();
    }
  }
}

// Define custom element if it doesn't exist already
if (!customElements.get('recipient-form')) {
  customElements.define('recipient-form', RecipientForm);
}
/******/ })()
;