class BooksManager {
    constructor() {
        this.apiBase = 'http://localhost:8000';
        this.currentBook = null;
        console.log('🔍 BooksManager initialized');
        this.init();
    }

    init() {
        console.log('🔍 BooksManager init started');
        this.loadBooks();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Book form submission
        document.getElementById('bookForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBook();
        });

        // Cancel button
        document.getElementById('cancelBook')?.addEventListener('click', () => {
            window.location.href = 'books.html';
        });
    }

    async loadBooks() {
        console.log('🔍 loadBooks called');
        console.log('🔍 auth.isAuthenticated():', auth.isAuthenticated());
        console.log('🔍 localStorage token:', localStorage.getItem('token'));
        console.log('🔍 auth.token:', auth.token);

        if (!auth.isAuthenticated()) {
            console.log('❌ Not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        try {
            const headers = auth.getAuthHeaders();
            console.log('🔍 Request headers:', headers);
            console.log('🔍 Making request to:', `${this.apiBase}/books`);

            const response = await fetch(`${this.apiBase}/books`, {
                headers: headers
            });

            console.log('🔍 Response status:', response.status);
            console.log('🔍 Response headers:', response.headers);
            
            if (response.status === 401) {
                console.log('❌ 401 Unauthorized - Token issue');
                // Try to get more details from response
                const errorText = await response.text();
                console.log('🔍 Error response body:', errorText);
                
                this.showAlert('Your session has expired. Please login again.', 'warning');
                setTimeout(() => {
                    auth.logout();
                }, 2000);
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to load books: ${response.status}`);
            }

            const books = await response.json();
            console.log('✅ Books loaded successfully:', books);
            this.displayBooks(books);
        } catch (error) {
            console.error('❌ Error loading books:', error);
            this.showAlert('Error loading books: ' + error.message, 'danger');
        }
    }

    displayBooks(books) {
        const container = document.getElementById('booksContainer');
        if (!container) return;

        if (books.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        No books found. Add your first book!
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = books.map(book => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card book-card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${this.escapeHtml(book.title)}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">by ${this.escapeHtml(book.author)}</h6>
                        ${book.publication_date ? `<p class="card-text"><small class="text-muted">Published: ${book.publication_date}</small></p>` : ''}
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-warning btn-sm me-2" onclick="booksManager.editBook(${book.id}, '${this.escapeHtml(book.title)}', '${this.escapeHtml(book.author)}', '${book.publication_date || ''}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="booksManager.deleteBook(${book.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async saveBook() {
        // Get values directly by ID
        const bookData = {
            title: document.getElementById('bookTitle')?.value || '',
            author: document.getElementById('bookAuthor')?.value || '',
            publication_date: document.getElementById('bookPublicationDate')?.value || null
        };

        console.log('🔍 Book data:', bookData);
        console.log('🔍 Current book (for edit):', this.currentBook);

        // Validate required fields
        if (!bookData.title.trim() || !bookData.author.trim()) {
            this.showAlert('Title and Author are required fields!', 'danger');
            return;
        }

        try {
            let url, method, successMessage;

            if (this.currentBook) {
                // ✅ UPDATE existing book
                url = `${this.apiBase}/books/${this.currentBook.id}`;
                method = 'PUT';
                successMessage = 'Book updated successfully!';
                console.log(`🔍 Updating book ID: ${this.currentBook.id}`);
            } else {
                // ✅ CREATE new book
                url = `${this.apiBase}/books`;
                method = 'POST';
                successMessage = 'Book added successfully!';
                console.log('🔍 Creating new book');
            }

            console.log(`🔍 Making ${method} request to: ${url}`);

            const response = await fetch(url, {
                method: method,
                headers: auth.getAuthHeaders(),
                body: JSON.stringify(bookData)
            });

            console.log('🔍 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('🔍 Error response:', errorText);
                
                let errorMessage = `Failed to ${this.currentBook ? 'update' : 'save'} book`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.detail || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('✅ Book operation successful:', result);

            this.showAlert(successMessage, 'success');
            setTimeout(() => {
                window.location.href = 'books.html';
            }, 1000);

        } catch (error) {
            console.error('❌ Error saving book:', error);
            this.showAlert('Error saving book: ' + error.message, 'danger');
        }
    }

    editBook(bookId, title, author, publicationDate) {
        // Pass book data via URL parameters instead of fetching from API
        const params = new URLSearchParams({
            id: bookId,
            title: encodeURIComponent(title),
            author: encodeURIComponent(author),
            publication_date: publicationDate || ''
        });
        window.location.href = `book-form.html?${params.toString()}`;
    }

    async loadBookForEdit() {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');

        console.log('🔍 Loading book for edit, ID:', bookId);

        if (!bookId) {
            console.log('🔍 No book ID provided, this is a new book form');
            return;
        }

        // If book data is passed in URL parameters, use that
        const title = urlParams.get('title');
        const author = urlParams.get('author');
        const publication_date = urlParams.get('publication_date');

        if (title && author) {
            this.currentBook = {
                id: parseInt(bookId),
                title: decodeURIComponent(title),
                author: decodeURIComponent(author),
                publication_date: publication_date || null
            };
            console.log('✅ Book loaded from URL parameters:', this.currentBook);
            this.populateForm(this.currentBook);
            return;
        }

        // Otherwise try to load from API
        try {
            console.log('🔍 Loading book details from API for ID:', bookId);
            const response = await fetch(`${this.apiBase}/books/${bookId}`, {
                headers: auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to load book: ${response.status}`);
            }

            this.currentBook = await response.json();
            console.log('✅ Book loaded from API:', this.currentBook);
            this.populateForm(this.currentBook);
            
        } catch (error) {
            console.error('❌ Error loading book from API:', error);
            // Fallback: try to load from all books
            await this.loadSingleBookFromAll(bookId);
        }
    }

    async loadSingleBookFromAll(bookId) {
        try {
            console.log('🔍 Loading all books to find book ID:', bookId);
            
            const response = await fetch(`${this.apiBase}/books`, {
                headers: auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load books');
            }

            const allBooks = await response.json();
            console.log('🔍 All books loaded:', allBooks);
            
            // Find the book with matching ID
            this.currentBook = allBooks.find(book => book.id == bookId);
            
            if (!this.currentBook) {
                throw new Error('Book not found in your collection');
            }
            
            console.log('✅ Book found from all books:', this.currentBook);
            this.populateForm(this.currentBook);
            
        } catch (error) {
            console.error('❌ Error loading book from all books:', error);
            throw error;
        }
    }

    populateForm(book) {
        console.log('🔍 Populating form with book:', book);
        
        // Set the current book for update operations
        this.currentBook = book;
        
        // Fill form fields
        document.getElementById('bookTitle').value = book.title;
        document.getElementById('bookAuthor').value = book.author;
        document.getElementById('bookPublicationDate').value = book.publication_date || '';
        
        // Update form title and button
        const formTitle = document.querySelector('.card-title');
        const submitButton = document.querySelector('button[type="submit"]');
        
        if (formTitle) {
            formTitle.textContent = 'Edit Book';
            formTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Book';
        }
        
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Update Book';
            submitButton.textContent = 'Update Book';
        }
        
        console.log('✅ Form populated for editing, currentBook set:', this.currentBook);
    }

    async deleteBook(bookId) {
        if (!confirm('Are you sure you want to delete this book?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/books/${bookId}`, {
                method: 'DELETE',
                headers: auth.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to delete book');
            }

            this.showAlert('Book deleted successfully!', 'success');
            this.loadBooks();
        } catch (error) {
            this.showAlert('Error deleting book: ' + error.message, 'danger');
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

const booksManager = new BooksManager();