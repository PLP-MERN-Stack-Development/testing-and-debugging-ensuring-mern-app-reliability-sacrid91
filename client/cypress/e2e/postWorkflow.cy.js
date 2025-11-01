// client/cypress/e2e/postWorkflow.cy.js
describe('Post Workflow', () => {
    beforeEach(() => {
      // Visit the main page
      cy.visit('/');
    });
  
    it('should allow a user to fetch and view posts', () => {
      // Click the fetch posts button
      cy.get('button').contains('Fetch Posts').click();
  
      // Verify loading state
      cy.get('button').should('contain', 'Loading...').and('be.disabled');
  
      // Wait for posts to load and verify they appear
      cy.get('[data-testid="posts-container"]').should('be.visible');
      cy.get('.post-item').should('have.length.greaterThan', 0);
    });
  
    it('should handle API errors gracefully', () => {
      // Stub the API call to return an error
      cy.intercept('GET', '/api/posts', { statusCode: 500, body: { error: 'Internal Server Error' } }).as('getPostsError');
  
      cy.get('button').contains('Fetch Posts').click();
      
      // Should handle the error without crashing (loading state should end)
      cy.get('button').should('not.contain', 'Loading...').and('not.be.disabled');
    });
  
    it('should render the button component correctly', () => {
      // Test button interactions
      cy.get('button').first().should('be.visible');
      cy.get('button').first().should('not.be.disabled');
      
      // Test button click
      cy.get('button').first().click();
      cy.get('button').first().should('be.disabled');
    });
  });