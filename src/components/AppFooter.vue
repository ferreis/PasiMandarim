<script setup lang="ts">
import AudioLicenses from './AudioLicenses.vue'
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer-inner">
      <AudioLicenses />

      <section class="project-footer" aria-labelledby="project-footer-title">
        <div>
          <span class="footer-kicker">Sobre o projeto</span>
          <h2 id="project-footer-title">Learning Mandarin</h2>
          <p>
            Projeto de código aberto, gratuito e mantido sem fins lucrativos para apoiar o estudo
            de pronúncia e percepção auditiva do mandarim.
          </p>
        </div>

        <div class="project-footer-links">
          <span>
            Criado por
            <a href="https://github.com/ferreis" target="_blank" rel="noreferrer">
              Rafael Fernando dos Reis Mecabô (@ferreis)
            </a>
          </span>
          <a
            class="github-project-link"
            href="https://github.com/ferreis/learning_Mandarin"
            target="_blank"
            rel="noreferrer"
          >
            Ver projeto no GitHub
          </a>
        </div>
      </section>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 16px;
  border-top: 1px solid #d9e0e7;
  background: #edf1f4;
}

.site-footer-inner {
  width: min(1440px, calc(100% - 48px));
  margin: 0 auto;
}

.project-footer {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
  gap: 32px;
  align-items: end;
  padding: 28px 0 36px;
}

.footer-kicker {
  color: #52606d;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.project-footer h2 {
  margin: 6px 0 0;
  font-size: 1.25rem;
}

.project-footer p {
  max-width: 650px;
  margin: 10px 0 0;
  color: #52606d;
  line-height: 1.6;
}

.project-footer-links {
  display: grid;
  justify-items: end;
  gap: 12px;
  color: #52606d;
  font-size: 0.9rem;
  text-align: right;
}

.project-footer-links span a {
  color: #17202a;
  font-weight: 700;
}

.github-project-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 15px;
  border: 1px solid #17202a;
  border-radius: 999px;
  color: #17202a;
  font-weight: 800;
  text-decoration: none;
}

.github-project-link:hover {
  background: #17202a;
  color: #fff;
}

@media (max-width: 760px) {
  .site-footer-inner {
    width: calc(100% - 24px);
  }

  .project-footer {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .project-footer-links {
    justify-items: start;
    text-align: left;
  }
}
</style>
