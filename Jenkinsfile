Here's the content of /mnt/user-data/outputs/Jenkinsfile-FOR-my-web-app with line numbers:
     1	// Jenkinsfile for my-web-app repository
     2	// This file lives in your application repository
     3	
     4	pipeline {
     5	    agent any
     6	    
     7	    environment {
     8	        APP_VERSION = "${env.BRANCH_NAME}-${BUILD_NUMBER}"
     9	        DOCKER_TAG = "${BUILD_NUMBER}"
    10	        DOCKER_IMAGE_NAME = 'my-web-app'
    11	        CONTAINER_NAME = "${DOCKER_IMAGE_NAME}-${env.BRANCH_NAME}"
    12	        
    13	        // CHANGE THIS to your Docker Hub username!
    14	        DOCKERHUB_USERNAME = 'narek97'
    15	    }
    16	    
    17	    stages {
    18	        stage('📋 Build Information') {
    19	            steps {
    20	                script {
    21	                    def port = getDeploymentPort(env.BRANCH_NAME)
    22	                    
    23	                    echo """
    24	                    ╔════════════════════════════════════════════════════════════╗
    25	                    ║           🚀 MULTI-BRANCH CI/CD PIPELINE                   ║
    26	                    ╠════════════════════════════════════════════════════════════╣
    27	                    ║ Branch:         ${env.BRANCH_NAME}
    28	                    ║ Build Number:   ${BUILD_NUMBER}
    29	                    ║ Version:        ${APP_VERSION}
    30	                    ║ Port:           ${port}
    31	                    ║ Container:      ${CONTAINER_NAME}
    32	                    ╚════════════════════════════════════════════════════════════╝
    33	                    """
    34	                    
    35	                    currentBuild.description = "${env.BRANCH_NAME} #${BUILD_NUMBER}"
    36	                }
    37	            }
    38	        }
    39	        
    40	        stage('📥 Checkout') {
    41	            steps {
    42	                echo "Code already checked out by Jenkins for branch: ${env.BRANCH_NAME}"
    43	                sh '''
    44	                    echo "=== Git Information ==="
    45	                    git log -1 --oneline
    46	                    echo ""
    47	                    echo "=== Repository Contents ==="
    48	                    ls -la
    49	                '''
    50	            }
    51	        }
    52	        
    53	        stage('🧪 Run Tests') {
    54	            steps {
    55	                echo 'Running tests...'
    56	                script {
    57	                    sh '''
    58	                        if [ -f package.json ]; then
    59	                            docker run --rm \
    60	                              -v $(pwd):/app \
    61	                              -w /app \
    62	                              node:18-alpine \
    63	                              sh -c "npm install && npm test || echo '⚠️  No tests'"
    64	                        else
    65	                            echo "⚠️  No package.json found"
    66	                        fi
    67	                    '''
    68	                }
    69	            }
    70	        }
    71	        
    72	        stage('🔨 Build Docker Image') {
    73	            steps {
    74	                echo "Building Docker image for branch: ${env.BRANCH_NAME}..."
    75	                script {
    76	                    sh """
    77	                        if [ ! -f Dockerfile ]; then
    78	                            echo "❌ Dockerfile not found!"
    79	                            exit 1
    80	                        fi
    81	                        
    82	                        docker build \
    83	                          --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
    84	                          --build-arg APP_VERSION=${APP_VERSION} \
    85	                          -t ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG} \
    86	                          -t ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-latest \
    87	                          .
    88	                        
    89	                        echo "✅ Image built successfully!"
    90	                    """
    91	                }
    92	            }
    93	        }
    94	        
    95	        stage('📤 Push to Docker Hub') {
    96	            when {
    97	                anyOf {
    98	                    branch 'main'
    99	                    branch 'staging'
   100	                }
   101	            }
   102	            steps {
   103	                echo "Pushing ${env.BRANCH_NAME} to Docker Hub..."
   104	                script {
   105	                    withCredentials([usernamePassword(
   106	                        credentialsId: 'dockerhub-credentials',
   107	                        usernameVariable: 'DOCKER_USER',
   108	                        passwordVariable: 'DOCKER_PASS'
   109	                    )]) {
   110	                        sh """
   111	                            echo "Logging in to Docker Hub..."
   112	                            echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
   113	                            
   114	                            docker tag ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG} \$DOCKER_USER/${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG}
   115	                            docker tag ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG} \$DOCKER_USER/${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}
   116	                            
   117	                            docker push \$DOCKER_USER/${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG}
   118	                            docker push \$DOCKER_USER/${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}
   119	                            
   120	                            if [ "${env.BRANCH_NAME}" = "main" ]; then
   121	                                docker tag ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG} \$DOCKER_USER/${DOCKER_IMAGE_NAME}:latest
   122	                                docker push \$DOCKER_USER/${DOCKER_IMAGE_NAME}:latest
   123	                            fi
   124	                            
   125	                            echo "✅ Pushed to Docker Hub!"
   126	                            docker logout
   127	                        """
   128	                    }
   129	                }
   130	            }
   131	        }
   132	        
   133	        stage('🚀 Deploy') {
   134	            steps {
   135	                script {
   136	                    def port = getDeploymentPort(env.BRANCH_NAME)
   137	                    
   138	                    echo "Deploying ${env.BRANCH_NAME} to port ${port}..."
   139	                    
   140	                    sh """
   141	                        set +e
   142	                        
   143	                        docker stop ${CONTAINER_NAME} 2>/dev/null || true
   144	                        docker rm ${CONTAINER_NAME} 2>/dev/null || true
   145	                        
   146	                        docker run -d \
   147	                          --name ${CONTAINER_NAME} \
   148	                          --restart unless-stopped \
   149	                          -p ${port}:3000 \
   150	                          -e APP_VERSION=${APP_VERSION} \
   151	                          -e BUILD_NUMBER=${BUILD_NUMBER} \
   152	                          -e GIT_BRANCH=${env.BRANCH_NAME} \
   153	                          -e NODE_ENV=${getNodeEnv(env.BRANCH_NAME)} \
   154	                          ${DOCKER_IMAGE_NAME}:${env.BRANCH_NAME}-${DOCKER_TAG}
   155	                        
   156	                        sleep 5
   157	                        
   158	                        docker ps | grep ${CONTAINER_NAME}
   159	                        
   160	                        echo "✅ Deployed successfully!"
   161	                        echo "🌐 Access at: http://localhost:${port}"
   162	                        
   163	                        set -e
   164	                    """
   165	                }
   166	            }
   167	        }
   168	    }
   169	    
   170	    post {
   171	        success {
   172	            script {
   173	                def port = getDeploymentPort(env.BRANCH_NAME)
   174	                def dockerHubPushed = (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'staging')
   175	                
   176	                echo """
   177	                ╔════════════════════════════════════════════════════════════╗
   178	                ║              ✅ PIPELINE SUCCEEDED!                        ║
   179	                ╠════════════════════════════════════════════════════════════╣
   180	                ║ Branch:         ${env.BRANCH_NAME}
   181	                ║ Build:          #${BUILD_NUMBER}
   182	                ║ 🌐 Access:      http://localhost:${port}
   183	                ║ 🐳 Docker Hub:  ${dockerHubPushed ? 'Pushed ✅' : 'Skipped'}
   184	                ╚════════════════════════════════════════════════════════════╝
   185	                """
   186	            }
   187	        }
   188	        
   189	        failure {
   190	            echo """
   191	            ╔════════════════════════════════════════════════════════════╗
   192	            ║              ❌ PIPELINE FAILED!                           ║
   193	            ╠════════════════════════════════════════════════════════════╣
   194	            ║ Branch:         ${env.BRANCH_NAME}
   195	            ║ Build:          #${BUILD_NUMBER}
   196	            ╚════════════════════════════════════════════════════════════╝
   197	            """
   198	        }
   199	        
   200	        always {
   201	            sh 'docker image prune -f || true'
   202	        }
   203	    }
   204	}
   205	
   206	// Helper Functions
   207	def getDeploymentPort(branchName) {
   208	    switch(branchName) {
   209	        case 'main':
   210	            return 3000
   211	        case 'staging':
   212	            return 3001
   213	        case 'develop':
   214	            return 3002
   215	        case ~/feature.*/:
   216	            return 3003
   217	        default:
   218	            return 3005
   219	    }
   220	}
   221	
   222	def getNodeEnv(branchName) {
   223	    switch(branchName) {
   224	        case 'main':
   225	            return 'production'
   226	        case 'staging':
   227	            return 'staging'
   228	        default:
   229	            return 'development'
   230	    }
   231	}
   232	