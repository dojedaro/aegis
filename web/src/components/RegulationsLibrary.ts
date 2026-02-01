import { regulations, searchRegulations, type Article, type Framework } from "../data/regulations.js";

export class RegulationsLibrary {
  private containerId: string;
  private selectedFramework: string = "all";
  private searchQuery: string = "";
  private searchResults: Article[] = [];

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  render(): void {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="regulations-header" style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Regulatory Framework Library</h2>
        <p style="color: var(--color-text-muted);">
          Browse compliance requirements with direct links to official EU legislation (EUR-Lex).
        </p>
      </div>

      <div class="regulations-search" style="margin-bottom: 2rem;">
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px;">
            <input
              type="text"
              id="regulations-search-input"
              placeholder="Search across all regulations (e.g., 'biometric', 'consent', 'PEP')..."
              value="${this.searchQuery}"
              style="width: 100%; padding: 0.875rem 1rem; background: var(--color-bg-tertiary); border: 1px solid var(--color-border); border-radius: 0.5rem; color: var(--color-text); font-size: 1rem;"
            >
          </div>
          <div style="display: flex; gap: 0.5rem;">
            ${this.renderFrameworkFilters()}
          </div>
        </div>
        ${this.searchQuery ? `
          <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--color-text-muted);">
            Found ${this.searchResults.length} result${this.searchResults.length !== 1 ? "s" : ""} for "${this.searchQuery}"
          </div>
        ` : ""}
      </div>

      <div class="regulations-content">
        ${this.searchQuery ? this.renderSearchResults() : this.renderFrameworkContent()}
      </div>
    `;

    this.attachEventListeners();
  }

  private renderFrameworkFilters(): string {
    const frameworks = [
      { id: "all", name: "All" },
      ...regulations.map(f => ({ id: f.id, name: f.name }))
    ];

    return frameworks.map(f => `
      <button
        class="btn ${this.selectedFramework === f.id ? "btn-primary" : "btn-secondary"}"
        data-framework="${f.id}"
        style="white-space: nowrap;"
      >
        ${f.name}
      </button>
    `).join("");
  }

  private renderSearchResults(): string {
    if (this.searchResults.length === 0) {
      return `
        <div style="text-align: center; padding: 3rem; color: var(--color-text-muted);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <p>No results found for "${this.searchQuery}"</p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">Try different keywords like "consent", "verification", or "biometric"</p>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${this.searchResults.map(article => this.renderArticleCard(article, true)).join("")}
      </div>
    `;
  }

  private renderFrameworkContent(): string {
    const frameworksToShow = this.selectedFramework === "all"
      ? regulations
      : regulations.filter(f => f.id === this.selectedFramework);

    return frameworksToShow.map(framework => `
      <div class="framework-section" style="margin-bottom: 2.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border);">
          <div>
            <h3 style="font-size: 1.25rem; color: var(--color-primary); margin-bottom: 0.25rem;">${framework.name}</h3>
            <p style="font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">${framework.fullName}</p>
            <p style="font-size: 0.875rem; color: var(--color-text-secondary);">${framework.description}</p>
          </div>
          <a href="${framework.officialLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="white-space: nowrap; text-decoration: none;">
            View Full Text ↗
          </a>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${framework.articles.map(article => this.renderArticleCard(article)).join("")}
        </div>
      </div>
    `).join("");
  }

  private renderArticleCard(article: Article, showFramework: boolean = false): string {
    const frameworkId = article.id.split(":")[0] || article.id.split("-")[0];
    const framework = regulations.find(f => f.id === frameworkId || article.id.startsWith(f.id));

    return `
      <div class="article-card" data-article-id="${article.id}" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 1.25rem; cursor: pointer; transition: all 0.15s ease;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
              ${showFramework && framework ? `<span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--color-primary-subtle); color: var(--color-primary); border-radius: 0.25rem;">${framework.name}</span>` : ""}
              <h4 style="font-size: 1rem; color: var(--color-text); margin: 0;">${article.title}</h4>
            </div>
            <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.75rem; line-height: 1.6;">${article.summary}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.375rem;">
              ${article.keywords.slice(0, 5).map(k => `<span style="font-size: 0.6875rem; padding: 0.125rem 0.375rem; background: var(--color-bg-tertiary); color: var(--color-text-muted); border-radius: 0.25rem;">${k}</span>`).join("")}
            </div>
          </div>
          <a href="${article.officialLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.375rem 0.75rem; white-space: nowrap; text-decoration: none;" onclick="event.stopPropagation();">
            EUR-Lex ↗
          </a>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Search input
    const searchInput = document.getElementById("regulations-search-input");
    let debounceTimer: number;

    searchInput?.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        this.searchQuery = (e.target as HTMLInputElement).value;
        if (this.searchQuery.length >= 2) {
          this.searchResults = searchRegulations(this.searchQuery);
        } else {
          this.searchResults = [];
        }
        this.render();
      }, 300);
    });

    // Framework filter buttons
    document.querySelectorAll("[data-framework]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.selectedFramework = (btn as HTMLElement).dataset.framework || "all";
        this.searchQuery = "";
        this.searchResults = [];
        this.render();
      });
    });

    // Article cards
    document.querySelectorAll(".article-card").forEach(card => {
      card.addEventListener("click", () => {
        const articleId = (card as HTMLElement).dataset.articleId;
        if (articleId) {
          this.showArticleDetail(articleId);
        }
      });

      // Hover effect
      card.addEventListener("mouseenter", () => {
        (card as HTMLElement).style.borderColor = "var(--color-primary)";
        (card as HTMLElement).style.transform = "translateY(-2px)";
      });
      card.addEventListener("mouseleave", () => {
        (card as HTMLElement).style.borderColor = "var(--color-border)";
        (card as HTMLElement).style.transform = "none";
      });
    });
  }

  private showArticleDetail(articleId: string): void {
    // Find the article across all frameworks
    let article: Article | undefined;
    let framework: Framework | undefined;

    for (const f of regulations) {
      const found = f.articles.find(a => a.id === articleId || `${f.id}:${a.id}` === articleId);
      if (found) {
        article = found;
        framework = f;
        break;
      }
    }

    if (!article || !framework) return;

    const existingModal = document.getElementById("article-detail-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "article-detail-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    `;

    modal.innerHTML = `
      <div style="background: var(--color-bg-secondary); border-radius: 1rem; max-width: 700px; width: 100%; max-height: 85vh; overflow-y: auto; border: 1px solid var(--color-border);">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: flex-start; position: sticky; top: 0; background: var(--color-bg-secondary); z-index: 1;">
          <div>
            <span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--color-primary-subtle); color: var(--color-primary); border-radius: 0.25rem; display: inline-block; margin-bottom: 0.5rem;">${framework.name}</span>
            <h3 style="color: var(--color-text); font-size: 1.25rem; margin: 0;">${article.title}</h3>
          </div>
          <button id="close-article-modal" style="background: none; border: none; color: var(--color-text-muted); font-size: 1.5rem; cursor: pointer; padding: 0.25rem;">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Summary</h4>
            <p style="color: var(--color-text); line-height: 1.7; font-size: 1rem;">${article.summary}</p>
          </div>

          <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--color-primary-subtle); border-radius: 0.5rem; border-left: 3px solid var(--color-primary);">
            <h4 style="font-size: 0.75rem; color: var(--color-primary); text-transform: uppercase; margin-bottom: 0.5rem;">Why It Matters for Identity/KYC</h4>
            <p style="color: var(--color-text-secondary); line-height: 1.6; font-size: 0.9375rem;">${article.relevance}</p>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.75rem;">Related Topics</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${article.keywords.map(k => `<span style="font-size: 0.8125rem; padding: 0.375rem 0.75rem; background: var(--color-bg-tertiary); color: var(--color-text-secondary); border-radius: 0.375rem;">${k}</span>`).join("")}
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
            <a href="${article.officialLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="flex: 1; text-align: center; text-decoration: none;">
              View on EUR-Lex ↗
            </a>
            <a href="${framework.officialLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="flex: 1; text-align: center; text-decoration: none;">
              Full ${framework.name} Text ↗
            </a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("close-article-modal")?.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
    document.addEventListener("keydown", function escHandler(e) {
      if (e.key === "Escape") {
        modal.remove();
        document.removeEventListener("keydown", escHandler);
      }
    });
  }
}
