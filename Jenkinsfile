// MindBridge CI/CD - builds the staging services, pushes to GHCR, and deploys
// them to the k3s staging namespace. Production stays on Docker Compose.
//
// Prerequisites in Jenkins:
//   - Credentials 'ghcr-credentials' (username = GitHub user, password = PAT with
//     write:packages) as a Username/Password credential.
//   - kubeconfig mounted at /var/jenkins_home/.kube/config (see the Jenkins
//     compose file) OR a 'kubeconfig' secret file credential.
//   - Set GH_ORG below to your lowercase GitHub org/user.

pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    REGISTRY   = 'ghcr.io'
    GH_ORG     = 'your-gh-org'            // TODO: set to your lowercase GitHub org/user
    NAMESPACE  = 'mindbridge-staging'
    KUBECONFIG = '/var/jenkins_home/.kube/config'
    IMAGE_TAG  = "${env.GIT_COMMIT ? env.GIT_COMMIT.take(12) : env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Frontend CI') {
      agent {
        docker {
          image 'node:20-bookworm'
          reuseNode true
          args '-u root:root'
        }
      }
      steps {
        dir('frontend') {
          sh 'npm ci'
          sh 'npm run lint || true'   // informational, matches GitHub Actions
          sh 'npm run build'
          sh 'npx vitest run --passWithNoTests'
        }
      }
    }

    stage('Backend smoke tests') {
      steps {
        script {
          def services = ['auth-service', 'content-service', 'admin-service']
          for (svc in services) {
            def img = "mindbridge-ci/${svc}:${IMAGE_TAG}"
            // Build once here and reuse for the smoke check; the Build stage
            // retags for GHCR.
            sh "docker build -f services/${svc}/Dockerfile -t ${img} ."
            // manage.py check validates the app wiring without needing a DB.
            sh "docker run --rm -e DJANGO_SETTINGS_MODULE=core.settings.development ${img} python manage.py check"
          }
        }
      }
    }

    stage('Build & Push images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'ghcr-credentials', usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_TOKEN')]) {
          sh 'echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin'
          script {
            def services = ['auth-service', 'content-service', 'admin-service']
            for (svc in services) {
              def repo = "${REGISTRY}/${GH_ORG}/mindbridge-${svc}"
              sh """
                docker build -f services/${svc}/Dockerfile -t ${repo}:${IMAGE_TAG} -t ${repo}:staging .
                docker push ${repo}:${IMAGE_TAG}
                docker push ${repo}:staging
              """
            }
          }
        }
      }
    }

    stage('Deploy to k3s staging') {
      steps {
        script {
          // Ensure base resources exist (namespace, services, deployments).
          sh "kubectl apply -k infra/k8s/overlays/staging"
          def services = ['auth-service', 'content-service', 'admin-service']
          for (svc in services) {
            def repo = "${REGISTRY}/${GH_ORG}/mindbridge-${svc}"
            // Pin to the immutable per-commit tag for this rollout.
            sh "kubectl -n ${NAMESPACE} set image deployment/${svc} ${svc}=${repo}:${IMAGE_TAG}"
            sh "kubectl -n ${NAMESPACE} rollout status deployment/${svc} --timeout=180s"
          }
        }
      }
    }

    stage('Health check') {
      steps {
        script {
          def checks = ['30001', '30007', '30008']
          for (port in checks) {
            sh "curl -fsS --retry 10 --retry-delay 6 --retry-all-errors http://127.0.0.1:${port}/api/v1/health/ > /dev/null"
          }
        }
      }
    }
  }

  post {
    always {
      sh 'docker logout ghcr.io || true'
      cleanWs()
    }
  }
}
