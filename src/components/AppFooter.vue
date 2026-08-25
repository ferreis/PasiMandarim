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
