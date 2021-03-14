# VMBot for Discord
## ...because why not

## Description 
This is a very simple bot really, it will allow you to interact with devices using the VNC Protocol via Discord. It's not really practical, as usability isn't great, however it was a fun little project.

## Recommendations / Hyporvisor
When setting up VMs, note that I only tested this on QEMU/KVM (with the argument `-vnc :0` for port 5900, `-vnc :1` for 5901, et cetera). I believe that VirtualBox also has a VNC Server option in the display, but do not quote me on that. I would personally advise running Linux (I've used Debian) as a host, as that allows you to setup QEMU with KVM (for virtualization and even passthrough should you choose to do that later).

## Usage
There are a handful of commands in the bot, here's a copy of the output of `!help` as it stands as of the writing of this document (subject to expansion/change - note that the commands requiring admin privs only show for users who have such permissions):
**Help Menu**
1. !prefix
  Change bot prefix [requires admin privs]
2. !default-vm
  Change default bot [requires admin privs]
3. !reconnect-vm
  Reconnect to a bot [requires admin privs]
4. !list
  List bots you can select and interact with.
5. !select
  Select bot to interact with.
6. !screen
  View your selected VM's screen.
7. !press
  Press keys.
8. !click
  Press the mouse buttons.
9. !type
  Press lots of buttons sequentially as to type.
10. !mouse
  Move the mouse.

## Setup
Some vague steps on how to setup this bot:
 1. Install QEMU (I'd recommend running Linux as a host OS, though any should work fine).
    * `sudo apt install qemu` should do the trick on Debain-based distros of Linux.
    * [The official site](https://www.qemu.org/download/) gives installers for other platforms.

 2. Clone this repo locally
    * `git clone git://www.github.com/John-Jelatis/VMBot-for-Discord` will work if you have git installed.
    * Otherwise, you can download as a ZIP and extract with the button in the top of the page.

 3. Edit the configuration files.
    a. Start with the `config.plist`, which you will want to customize to fit your VMs appropriately.
       * You can use `localhost` as an IP if it's running on the same system as the node script.
       * The specs aren't used for more than the system listing at the moment, however I plan to make it so administrators can remotely (re-)start bots at some point.
       * You can remove the `http-server` module in the bottom if you do not want it; it hosts a png of the screen on whatever port you've configured it to.

    b. Next, edit `config-http-server.json` (if appropriate).
       * Make sure the port isn't in use.
       * You can disable this by removing the module from `config.json`.

    c. Finally, edit `config-discord-bot.json` (if appropriate).
       * Make sure your bot token is valid and that it can post images.
       * You can disable this by removing the module from `config.json`.

 4. Launch with the script in that directory (or manually, but make sure to be in the right directory)
    * On Windows, you will obviously want the batch script; `Start-VMBot.bat`.
      * It's been years since I've mained Windows; if my batch script is broken, please put up an issue or pull request. 
      * This makes sure that `npm install` is run not only within the `vmbot` folder, but within it's modules too.
    * On macOS and Linux, you will want to run the shell script; `Start-VMBot.command`.
    * Both of these scripts are set to auto-restart the bot should it crash.

## Feedback
If you have any feedback to leave, feel free to join the [VMBot's Discord server](https://discord.gg/jUrJaGKFdw)!
 
Stay safe (it's been quite an interesting year) and enjoy playing with this creation!
