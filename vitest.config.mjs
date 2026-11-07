// Fuso horário fixo para os testes: a app usa o fuso do dispositivo; os testes de mudança de hora
// precisam de Europe/Lisbon, seja qual for o fuso da máquina que os executa.
process.env.TZ = 'Europe/Lisbon';
export default { test: { env: { TZ: 'Europe/Lisbon' } } };
