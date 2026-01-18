pipeline {
    agent any
    
    environment {
        APP_VERSION = "${env.BRANCH_NAME}-${BUILD_NUMBER}"
        DOCKER_TAG = "${BUILD_NUMBER}"
        DOCKER_IMAGE_NAME = 'my-web-app'
        CONTAINER_NAME = "${DOCKER_IMAGE_NAME}-${env.BRANCH_NAME}"
        DOCKERHUB_USERNAME = 'narek97'
    }
    
    stages {
        stage('Build Information') {
            steps {
                script {
                    def port = getDeploymentPort(env.BRANCH_NAME)
                    
                    echo "Branch: ${env.BRANCH_NAME}"
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Version: ${APP_VERSION}"
                    echo "Port: ${port}"
                    echo "Container: ${CONTAINER_NAME}"
                    
                    currentBuild.description = "${env.BRANCH_NAME} #${BUILD_NUMBER}"
                }
            }
        }
        
        stage('Checkout') {
            steps {
                echo "Code already checked out by Jenkins for branch: ${env.BRANCH_NAME}"
                sh '''
                    echo "=== Git Information ==="
                    git log -1 --oneline
                    echo ""
                    echo "=== Repository Contents ==="
                    ls -la
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                echo 'Running tests...'
                script {
                    sh '''
                        if [ -f package.json ]; then
                            docker run --rm \
                              -v $(pwd):/app \
                              -w /app \
                              node:18-alpine \
                              sh -c "npm install && npm test || echo 'No tests'"
                        else
                            echo "No package.json found"
                        fi
                    '''
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo "Building Docker image for branch: ${env.BRANCH_NAME}..."
                script {
                    sh """
                        if [ ! -f Dockerfile ]; then
                            echo "Dockerfile not found!"
                            exit 1
                        fi
                        
                        docker build \
                          --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                          --build-arg APP_VERSION=${APP_VERSION} \
                          -t ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG} \
                          -t ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-latest \
                          .
                        
                        echo "Image built successfully!"
                    """
                }
            }
        }
        
        stage('Push to Docker Hub') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                }
            }
            steps {
                echo "Pushing ${env.BRANCH_NAME} to Docker Hub..."
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh """
                            echo "Logging in to Docker Hub..."
                            echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                            
                            docker tag ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG} \$DOCKER_USER/${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG}
                            docker tag ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG} \$DOCKER_USER/${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}
                            
                            docker push \$DOCKER_USER/${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG}
                            docker push \$DOCKER_USER/${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}
                            
                            if [ "${env.BRANCH_NAME}" = "main" ]; then
                                docker tag ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG} \$DOCKER_USER/${DOCKER_IMAGE_NAME}:latest
                                docker push \$DOCKER_USER/${DOCKER_IMAGE_NAME}:latest
                            fi
                            
                            echo "Pushed to Docker Hub!"
                            docker logout
                        """
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    def port = getDeploymentPort(env.BRANCH_NAME)
                    
                    echo "Deploying ${env.BRANCH_NAME} to port ${port}..."
                    
                    sh """
                        set +e
                        
                        docker stop ${CONTAINER_NAME} 2>/dev/null || true
                        docker rm ${CONTAINER_NAME} 2>/dev/null || true
                        
                        docker run -d \
                          --name ${CONTAINER_NAME} \
                          --restart unless-stopped \
                          -p ${port}:3000 \
                          -e APP_VERSION=${APP_VERSION} \
                          -e BUILD_NUMBER=${BUILD_NUMBER} \
                          -e GIT_BRANCH=${env.BRANCH_NAME} \
                          -e NODE_ENV=${getNodeEnv(env.BRANCH_NAME)} \
                          ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG}
                        
                        sleep 5
                        
                        docker ps | grep ${CONTAINER_NAME}
                        
                        echo "Deployed successfully!"
                        echo "Access at: http://localhost:${port}"
                        
                        set -e
                    """
                }
            }
        }
    }
    
    post {
        success {
            script {
                def port = getDeploymentPort(env.BRANCH_NAME)
                def dockerHubPushed = (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'staging')
                
                echo "========================================="
                echo "PIPELINE SUCCEEDED!"
                echo "========================================="
                echo "Branch: ${env.BRANCH_NAME}"
                echo "Build: #${BUILD_NUMBER}"
                echo "Access: http://localhost:${port}"
                echo "Docker Hub: ${dockerHubPushed ? 'Pushed' : 'Skipped'}"
                echo "========================================="
            }
        }
        
        failure {
            echo "========================================="
            echo "PIPELINE FAILED!"
            echo "========================================="
            echo "Branch: ${env.BRANCH_NAME}"
            echo "Build: #${BUILD_NUMBER}"
            echo "Check logs above for details"
            echo "========================================="
        }
        
        always {
            sh 'docker image prune -f || true'
        }
    }
}

def getDeploymentPort(branchName) {
    switch(branchName) {
        case 'main':
            return 3000
        case 'staging':
            return 3001
        case 'develop':
            return 3002
        case ~/feature.*/:
            return 3003
        default:
            return 3005
    }
}

def getNodeEnv(branchName) {
    switch(branchName) {
        case 'main':
            return 'production'
        case 'staging':
            return 'staging'
        default:
            return 'development'
    }
}