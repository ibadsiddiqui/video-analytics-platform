import 'reflect-metadata';
import { Container as TypeDIContainer } from 'typedi';
import { useContainer as routingUseContainer } from 'routing-controllers';

/**
 * Dependency Injection Container Setup
 * Configures TypeDI for use with routing-controllers
 */
export class Container {
  /**
   * Initialize the DI container
   */
  static initialize(): void {
    // Configure routing-controllers to use TypeDI
    routingUseContainer(TypeDIContainer);

    console.log('✅ TypeDI container initialized');
  }

  /**
   * Get the TypeDI container instance
   */
  static getInstance(): typeof TypeDIContainer {
    return TypeDIContainer;
  }

  /**
   * Reset the container (useful for testing)
   */
  static reset(): void {
    TypeDIContainer.reset();
    console.log('🔄 Container reset');
  }
}
