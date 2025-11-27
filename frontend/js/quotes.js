class QuotesManager {
    constructor() {
        this.apiBase = 'http://localhost:8000';
        this.currentQuote = null;
        console.log('🔍 QuotesManager initialized');
        this.init();
    }

    init() {
        console.log('🔍 QuotesManager init started');
        this.loadQuotes();
        this.setupEventListeners();
        this.loadQuoteForEdit(); // Load quote for editing if on quote-form.html
    }

    setupEventListeners() {
        // Quote form submission
        document.getElementById('quoteForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveQuote();
        });

        // Cancel button
        document.getElementById('cancelQuote')?.addEventListener('click', () => {
            window.location.href = 'quotes.html';
        });
    }

    async loadQuotes() {
        console.log('🔍 loadQuotes called');
        
        if (!auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/quotes`, {
                headers: auth.getAuthHeaders()
            });

            console.log('🔍 Quotes response status:', response.status);

            if (!response.ok) {
                throw new Error('Failed to load quotes');
            }

            const quotes = await response.json();
            console.log('✅ Quotes loaded successfully:', quotes);
            this.displayQuotes(quotes);
        } catch (error) {
            console.error('❌ Error loading quotes:', error);
            this.showAlert('Error loading quotes: ' + error.message, 'danger');
        }
    }

    displayQuotes(quotes) {
        const container = document.getElementById('quotesContainer');
        if (!container) return;

        if (quotes.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        No quotes found. Add your first quote!
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = quotes.map(quote => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card quote-card h-100">
                    <div class="card-body">
                        <blockquote class="blockquote mb-0">
                            <p>"${this.escapeHtml(quote.quote_text)}"</p>
                            <footer class="blockquote-footer">${this.escapeHtml(quote.author)}</footer>
                        </blockquote>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-warning btn-sm me-2" onclick="quotesManager.editQuote(${quote.id}, '${this.escapeHtml(quote.quote_text)}', '${this.escapeHtml(quote.author)}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="quotesManager.deleteQuote(${quote.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    editQuote(quoteId, quoteText, author) {
        console.log('🔍 Edit quote clicked:', quoteId, quoteText, author);
        
        // Pass quote data via URL parameters
        const params = new URLSearchParams({
            id: quoteId,
            quote_text: encodeURIComponent(quoteText),
            author: encodeURIComponent(author)
        });
        window.location.href = `quote-form.html?${params.toString()}`;
    }

    async loadQuoteForEdit() {
        const urlParams = new URLSearchParams(window.location.search);
        const quoteId = urlParams.get('id');

        console.log('🔍 Loading quote for edit, ID:', quoteId);

        if (!quoteId) {
            console.log('🔍 No quote ID provided, this is a new quote form');
            return;
        }

        // If quote data is passed in URL parameters, use that
        const quote_text = urlParams.get('quote_text');
        const author = urlParams.get('author');

        if (quote_text && author) {
            this.currentQuote = {
                id: parseInt(quoteId),
                quote_text: decodeURIComponent(quote_text),
                author: decodeURIComponent(author)
            };
            console.log('✅ Quote loaded from URL parameters:', this.currentQuote);
            this.populateForm(this.currentQuote);
            return;
        }

        // Otherwise try to load from API
        try {
            console.log('🔍 Loading quote details from API for ID:', quoteId);
            const response = await fetch(`${this.apiBase}/quotes/${quoteId}`, {
                headers: auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to load quote: ${response.status}`);
            }

            this.currentQuote = await response.json();
            console.log('✅ Quote loaded from API:', this.currentQuote);
            this.populateForm(this.currentQuote);
            
        } catch (error) {
            console.error('❌ Error loading quote from API:', error);
            // Fallback: try to load from all quotes
            await this.loadSingleQuoteFromAll(quoteId);
        }
    }

    async loadSingleQuoteFromAll(quoteId) {
        try {
            console.log('🔍 Loading all quotes to find quote ID:', quoteId);
            
            const response = await fetch(`${this.apiBase}/quotes`, {
                headers: auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load quotes');
            }

            const allQuotes = await response.json();
            console.log('🔍 All quotes loaded:', allQuotes);
            
            // Find the quote with matching ID
            this.currentQuote = allQuotes.find(quote => quote.id == quoteId);
            
            if (!this.currentQuote) {
                throw new Error('Quote not found in your collection');
            }
            
            console.log('✅ Quote found from all quotes:', this.currentQuote);
            this.populateForm(this.currentQuote);
            
        } catch (error) {
            console.error('❌ Error loading quote from all quotes:', error);
            this.showAlert('Error loading quote: ' + error.message, 'danger');
        }
    }

    populateForm(quote) {
        console.log('🔍 Populating form with quote:', quote);
        
        // Set the current quote for update operations
        this.currentQuote = quote;
        
        // Fill form fields
        document.getElementById('quote_text').value = quote.quote_text;
        document.getElementById('author').value = quote.author;
        
        // Update form title and button
        const formTitle = document.querySelector('.card-title');
        const submitButton = document.querySelector('button[type="submit"]');
        
        if (formTitle) {
            formTitle.textContent = 'Edit Quote';
            formTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Quote';
        }
        
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Update Quote';
            submitButton.textContent = 'Update Quote';
        }
        
        console.log('✅ Form populated for editing, currentQuote set:', this.currentQuote);
    }

    async saveQuote() {
        // Get values directly by ID
        const quoteData = {
            quote_text: document.getElementById('quote_text')?.value || '',
            author: document.getElementById('author')?.value || ''
        };

        console.log('🔍 Quote data:', quoteData);
        console.log('🔍 Current quote (for edit):', this.currentQuote);

        // Validate required fields
        if (!quoteData.quote_text.trim() || !quoteData.author.trim()) {
            this.showAlert('Quote text and Author are required fields!', 'danger');
            return;
        }

        try {
            let url, method, successMessage;

            if (this.currentQuote) {
                // ✅ UPDATE existing quote
                url = `${this.apiBase}/quotes/${this.currentQuote.id}`;
                method = 'PUT';
                successMessage = 'Quote updated successfully!';
                console.log(`🔍 Updating quote ID: ${this.currentQuote.id}`);
            } else {
                // ✅ CREATE new quote
                url = `${this.apiBase}/quotes`;
                method = 'POST';
                successMessage = 'Quote added successfully!';
                console.log('🔍 Creating new quote');
            }

            console.log(`🔍 Making ${method} request to: ${url}`);

            const response = await fetch(url, {
                method: method,
                headers: auth.getAuthHeaders(),
                body: JSON.stringify(quoteData)
            });

            console.log('🔍 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('🔍 Error response:', errorText);
                
                let errorMessage = `Failed to ${this.currentQuote ? 'update' : 'save'} quote`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.detail || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('✅ Quote operation successful:', result);

            this.showAlert(successMessage, 'success');
            setTimeout(() => {
                window.location.href = 'quotes.html';
            }, 1000);

        } catch (error) {
            console.error('❌ Error saving quote:', error);
            this.showAlert('Error saving quote: ' + error.message, 'danger');
        }
    }

    async deleteQuote(quoteId) {
        if (!confirm('Are you sure you want to delete this quote?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/quotes/${quoteId}`, {
                method: 'DELETE',
                headers: auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to delete quote');
            }

            this.showAlert('Quote deleted successfully!', 'success');
            this.loadQuotes();
        } catch (error) {
            this.showAlert('Error deleting quote: ' + error.message, 'danger');
        }
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

const quotesManager = new QuotesManager();