import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../../Services/login/login.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  constructor(private fb: FormBuilder, private loginService: LoginService, private router: Router , private messageService: MessageService) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit(): void { }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.status === 200) {
          this.loginService.tokenGenerator().subscribe({
            next: (res) => {
              localStorage.setItem('token', res.toString());
              console.log("Token generated", res);
              this.router.navigate(['/map']);
            },
            error: (err) => {
              console.error("Token generation error", err);
            }
          });
        }
      },
      error: (err) => {
        console.error('Login failed', err);
        this.messageService.add({ severity: 'error', summary: 'Login Failed', detail: 'Username or password is incorrect.' });
      },
      complete: () => {
        console.info('Login complete');
      }
    });

    console.log('Form Submitted', this.loginForm.value);
  }
}
