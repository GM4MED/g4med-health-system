/**
 * ===========================================================================
 * MÓDULO FINANCEIRO - GM4med
 * Autor: Front-End Sênior Specialist
 * Versão: 2.0
 * Descrição: Gestão completa da aba Financeiro com detecção de bandeiras,
 *            máscaras, validações e parcelamento
 * ===========================================================================
 */

(() => {
    const GM4medFinanceiro = {
        els: {},
        state: {
            valorBase: 0,
            parcelas: 1,
            metodoPagamento: 'dinheiro',
            brand: 'unknown',
            brandDetected: false
        },

        // ==================== INICIALIZAÇÃO ====================
        init() {
            this.cache();
            this.bind();
            this.updateInstallments();
            this.toggleCreditoPanel(this.getPaymentMethod() === 'credito');
            this.applyInitialValues();
            this.resetBrands();
            console.log('[GM4med] Módulo Financeiro inicializado com sucesso.');
        },

        // ==================== CACHE DE ELEMENTOS ====================
        cache() {
            this.els.form = document.getElementById('financeiroForm');
            this.els.valorTotalInput = document.getElementById('financeiroValorTotal');
            this.els.valorTotalDisplay = document.getElementById('financeiroValorTotalDisplay');
            this.els.valorConsulta = document.getElementById('valorConsulta');
            this.els.parcelas = document.getElementById('parcelas');
            this.els.valorParcelaDisplay = document.getElementById('valorParcelaDisplay');
            this.els.valorTotalResumo = document.getElementById('valorTotalResumo');
            this.els.creditoPanel = document.getElementById('creditoPanel');
            this.els.cartaoNumero = document.getElementById('cartaoNumero');
            this.els.cartaoTitular = document.getElementById('cartaoTitular');
            this.els.cartaoDocumento = document.getElementById('cartaoDocumento');
            this.els.cartaoValidade = document.getElementById('cartaoValidade');
            this.els.cartaoCvv = document.getElementById('cartaoCvv');
            this.els.cardBrandsContainer = document.querySelector('.GM4med-card-brands');
            this.els.brandIcons = document.querySelectorAll('.GM4med-brand-icon');
            this.els.brandStatus = document.getElementById('brandStatus');
            this.els.limpar = document.getElementById('limparFinanceiro');
            this.els.paymentMethods = [...document.querySelectorAll('input[name="financeiro[metodo_pagamento]"]')];
            this.els.errors = [...document.querySelectorAll('.GM4med-field__error')];
        },

        // ==================== BIND DE EVENTOS ====================
        bind() {
            // Métodos de pagamento
            this.els.paymentMethods.forEach(input => {
                input.addEventListener('change', () => {
                    this.state.metodoPagamento = this.getPaymentMethod();
                    this.toggleCreditoPanel(this.state.metodoPagamento === 'credito');
                    this.clearPanelErrors();
                });
            });

            // Valor da consulta
            this.els.valorConsulta.addEventListener('input', e => {
                e.target.value = this.maskCurrency(e.target.value);
                this.updateInstallments();
            });

            // Parcelas
            this.els.parcelas.addEventListener('change', () => this.updateInstallments());

            // Número do cartão com detecção de bandeira
            this.els.cartaoNumero.addEventListener('input', e => {
                e.target.value = this.maskCardNumber(e.target.value);
                this.updateBrandDetection(e.target.value);
            });

            this.els.cartaoNumero.addEventListener('blur', () => {
                this.validateCardNumber();
            });

            // Validade
            this.els.cartaoValidade.addEventListener('input', e => {
                e.target.value = this.maskExpiry(e.target.value);
            });

            // CPF/CNPJ
            this.els.cartaoDocumento.addEventListener('input', e => {
                e.target.value = this.maskCpfCnpj(e.target.value);
            });

            // CVV
            this.els.cartaoCvv.addEventListener('input', e => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
            });

            // Submit do formulário
            this.els.form.addEventListener('submit', e => {
                e.preventDefault();
                const payload = this.buildPayload();
                const validation = this.validate();

                if (!validation.valid) {
                    this.renderErrors(validation.errors);
                    return;
                }

                this.clearPanelErrors();
                console.log('✅ Payload Financeiro GM4med:', JSON.stringify(payload, null, 2));
                alert('Dados financeiros salvos com sucesso!');
            });

            // Limpar formulário
            this.els.limpar.addEventListener('click', () => this.resetForm());
        },

        // ==================== VALORES INICIAIS ====================
        applyInitialValues() {
            this.els.valorConsulta.value = this.maskCurrency(this.els.valorConsulta.value || '0');
            this.updateInstallments();
            this.resetBrands();
        },

        // ==================== MÉTODOS DE PAGAMENTO ====================
        getPaymentMethod() {
            const selected = this.els.paymentMethods.find(i => i.checked);
            return selected ? selected.value : 'dinheiro';
        },

        toggleCreditoPanel(show) {
            const panel = this.els.creditoPanel;
            panel.classList.toggle('is-collapsed', !show);
            panel.setAttribute('aria-hidden', String(!show));

            const fields = [
                this.els.cartaoNumero,
                this.els.cartaoTitular,
                this.els.cartaoDocumento,
                this.els.cartaoValidade,
                this.els.cartaoCvv
            ];

            fields.forEach(field => {
                field.toggleAttribute('disabled', !show);
            });

            if (!show) {
                this.resetBrands();
            }
        },

        // ==================== DETECÇÃO DE BANDEIRAS ====================
        resetBrands() {
            this.els.brandIcons.forEach(icon => {
                icon.classList.remove('is-active', 'is-error');
            });

            const unknown = this.els.cardBrandsContainer.querySelector('[data-brand="unknown"]');
            if (unknown) unknown.classList.add('is-active');

            this.setBrandStatus('Aguardando digitação...', 'neutral');
            this.els.cardBrandsContainer.classList.remove('is-error');
            this.state.brand = 'unknown';
            this.state.brandDetected = false;
        },

        detectBrand(number) {
            const digits = String(number || '').replace(/\D/g, '');

            const rules = [
                { name: 'visa', displayName: 'Visa', icon: 'fa-brands fa-cc-visa', match: /^4/ },
                { name: 'mastercard', displayName: 'Mastercard', icon: 'fa-brands fa-cc-mastercard', match: /^(5[1-5]|2(2[2-9]|[3-6]\d|7[0-1]\d|720))/ },
                { name: 'amex', displayName: 'American Express', icon: 'fa-brands fa-cc-amex', match: /^3[47]/ },
                { name: 'elo', displayName: 'Elo', icon: 'fa-brands fa-cc-elo', match: /^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|6364|6504|6505|6507|6509|6516|6550)/ },
                { name: 'hipercard', displayName: 'Hipercard', icon: 'fa-solid fa-credit-card', match: /^(606282|3841)/ },
                { name: 'discover', displayName: 'Discover', icon: 'fa-brands fa-cc-discover', match: /^(6011|64[4-9]|65)/ },
                { name: 'diners', displayName: 'Diners Club', icon: 'fa-brands fa-cc-diners-club', match: /^3(0[0-5]|[68])/ }
            ];

            const found = rules.find(rule => rule.match.test(digits));
            return found || { name: 'unknown', displayName: 'Não detectada', icon: 'fa-solid fa-credit-card' };
        },

        updateBrandDetection(value) {
            const digits = String(value || '').replace(/\D/g, '');
            const brand = this.detectBrand(value);

            this.state.brand = brand.name;
            this.state.brandDetected = (brand.name !== 'unknown' && digits.length >= 4);

            // Reset todas as bandeiras
            this.els.brandIcons.forEach(icon => {
                icon.classList.remove('is-active');
            });

            // Ativa a bandeira detectada
            const activeIcon = this.els.cardBrandsContainer.querySelector(`[data-brand="${brand.name}"]`);
            if (activeIcon) {
                activeIcon.classList.add('is-active');
            }

            // Atualiza status text
            if (this.state.brandDetected) {
                this.setBrandStatus(`Bandeira detectada: ${brand.displayName}`, 'detected');
            } else if (digits.length > 0) {
                this.setBrandStatus('Detectando bandeira...', 'neutral');
            } else {
                this.setBrandStatus('Aguardando digitação...', 'neutral');
            }

            // Remove estado de erro do container
            this.els.cardBrandsContainer.classList.remove('is-error');
        },

        validateCardNumber() {
            const digits = this.els.cartaoNumero.value.replace(/\D/g, '');
            const brand = this.detectBrand(this.els.cartaoNumero.value);

            const isValidLength = digits.length >= 13 && digits.length <= 19;
            const isRecognizedBrand = brand.name !== 'unknown';

            if (!isValidLength || !isRecognizedBrand) {
                this.els.cardBrandsContainer.classList.add('is-error');
                this.setBrandStatus('Número de cartão inválido ou bandeira não reconhecida', 'error');

                this.els.brandIcons.forEach(icon => {
                    icon.classList.add('is-error');
                });

                return false;
            }

            return true;
        },

        setBrandStatus(message, type) {
            const statusEl = this.els.brandStatus;
            const iconClass = type === 'detected' ? 'fa-solid fa-circle-check' :
                type === 'error' ? 'fa-solid fa-circle-exclamation' :
                    'fa-solid fa-circle-info';

            statusEl.className = `GM4med-brand-status is-${type}`;
            statusEl.innerHTML = `
        <i class="${iconClass}"></i>
        <span class="GM4med-brand-status__text">${message}</span>
      `;
        },

        // ==================== MÁSCARAS ====================
        maskCurrency(value) {
            const raw = String(value || '').replace(/\D/g, '');
            const number = (parseInt(raw || '0', 10) / 100);
            return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        },

        parseCurrency(value) {
            const raw = String(value || '').replace(/[^\d,-]/g, '').replace(',', '.');
            return parseFloat(raw || '0');
        },

        maskCardNumber(value) {
            const digits = String(value || '').replace(/\D/g, '').slice(0, 19);
            return digits.replace(/(.{4})/g, '$1 ').trim();
        },

        maskExpiry(value) {
            const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
            if (digits.length < 3) return digits;
            return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        },

        maskCpfCnpj(value) {
            const digits = String(value || '').replace(/\D/g, '').slice(0, 14);
            if (digits.length <= 11) {
                return digits
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            return digits
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        },

        // ==================== PARCELAMENTO ====================
        updateInstallments() {
            const total = this.parseCurrency(this.els.valorConsulta.value);
            const parcelas = parseInt(this.els.parcelas.value, 10) || 1;
            const valorParcela = parcelas > 0 ? total / parcelas : total;

            this.state.valorBase = total;
            this.state.parcelas = parcelas;

            this.els.valorTotalInput.value = total.toFixed(2);
            this.els.valorTotalDisplay.textContent = this.formatCurrency(total);
            this.els.valorTotalResumo.textContent = this.formatCurrency(total);
            this.els.valorParcelaDisplay.textContent = this.formatCurrency(valorParcela);
        },

        formatCurrency(value) {
            return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        },

        // ==================== VALIDAÇÃO ====================
        validate() {
            const errors = {};

            if (!this.els.valorConsulta.value || this.parseCurrency(this.els.valorConsulta.value) <= 0) {
                errors.valorConsulta = 'Informe um valor válido.';
            }

            if (this.state.metodoPagamento === 'credito') {
                const cardDigits = this.els.cartaoNumero.value.replace(/\D/g, '');
                const cpfCnpjDigits = this.els.cartaoDocumento.value.replace(/\D/g, '');
                const expiry = this.els.cartaoValidade.value;
                const cvv = this.els.cartaoCvv.value;

                if (cardDigits.length < 13) errors.cartaoNumero = 'Número do cartão inválido.';
                if (!this.els.cartaoTitular.value.trim()) errors.cartaoTitular = 'Informe o titular.';
                if (!(cpfCnpjDigits.length === 11 || cpfCnpjDigits.length === 14)) errors.cartaoDocumento = 'CPF ou CNPJ inválido.';
                if (!/^\d{2}\/\d{2}$/.test(expiry)) errors.cartaoValidade = 'Use o formato MM/AA.';
                if (!(cvv.length === 3 || cvv.length === 4)) errors.cartaoCvv = 'CVV inválido.';
            }

            return { valid: Object.keys(errors).length === 0, errors };
        },

        renderErrors(errors) {
            this.clearPanelErrors();

            Object.entries(errors).forEach(([field, message]) => {
                const errorEl = document.querySelector(`[data-error-for="${field}"]`);
                const inputEl = document.getElementById(field);

                if (errorEl) errorEl.textContent = message;
                if (inputEl) inputEl.setAttribute('aria-invalid', 'true');
            });
        },

        clearPanelErrors() {
            this.els.errors.forEach(el => el.textContent = '');

            [
                this.els.valorConsulta,
                this.els.cartaoNumero,
                this.els.cartaoTitular,
                this.els.cartaoDocumento,
                this.els.cartaoValidade,
                this.els.cartaoCvv
            ].forEach(el => el && el.removeAttribute('aria-invalid'));

            this.els.cardBrandsContainer.classList.remove('is-error');
        },

        // ==================== PAYLOAD ====================
        buildPayload() {
            return {
                financeiro: {
                    metodo_pagamento: this.getPaymentMethod(),
                    valor_total: this.state.valorBase,
                    parcelas: this.state.parcelas,
                    valor_parcela: this.state.valorBase / this.state.parcelas,
                    cartao: this.state.metodoPagamento === 'credito' ? {
                        numero: this.els.cartaoNumero.value.replace(/\s/g, ''),
                        titular: this.els.cartaoTitular.value.trim(),
                        documento: this.els.cartaoDocumento.value.replace(/\D/g, ''),
                        validade: this.els.cartaoValidade.value,
                        cvv: this.els.cartaoCvv.value,
                        bandeira: this.state.brand
                    } : null
                }
            };
        },

        // ==================== RESET ====================
        resetForm() {
            this.els.form.reset();
            this.els.valorConsulta.value = 'R$ 0,00';
            this.els.parcelas.value = '1';
            this.state.metodoPagamento = 'dinheiro';
            this.toggleCreditoPanel(false);
            this.updateBrandDetection('');
            this.updateInstallments();
            this.clearPanelErrors();
            console.log('[GM4med] Formulário financeiro resetado.');
        }
    };

    // Inicialização automática
    document.addEventListener('DOMContentLoaded', () => GM4medFinanceiro.init());

    // Exporta para uso global
    window.GM4medFinanceiro = GM4medFinanceiro;
})();