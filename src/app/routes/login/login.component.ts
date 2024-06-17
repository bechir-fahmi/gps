import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../../Services/login/login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  constructor(private fb: FormBuilder, private loginService: LoginService, private router: Router) {
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
      },
      complete: () => {
        console.info('Login complete');
      }
    });

    console.log('Form Submitted', this.loginForm.value);
  }
}
